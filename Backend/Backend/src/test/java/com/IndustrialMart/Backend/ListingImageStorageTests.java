package com.IndustrialMart.Backend;

import com.IndustrialMart.Backend.listing.ListingImageStorage;
import com.IndustrialMart.Backend.listing.CloudinaryAssetClient;
import com.IndustrialMart.Backend.listing.ListingPhotoBlob;
import com.IndustrialMart.Backend.listing.ListingPhotoBlobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ListingImageStorageTests {
    private static final byte[] PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/nXcAAAAASUVORK5CYII=");

    @TempDir Path legacyDirectory;
    private ListingPhotoBlobRepository photos;
    private S3Client legacyS3;
    private CloudinaryAssetClient cloudinary;
    private Map<String, ListingPhotoBlob> stored;
    private ListingImageStorage storage;

    @BeforeEach
    void setup() {
        photos = mock(ListingPhotoBlobRepository.class);
        legacyS3 = mock(S3Client.class);
        cloudinary = mock(CloudinaryAssetClient.class);
        stored = new HashMap<>();
        when(photos.save(any(ListingPhotoBlob.class))).thenAnswer(invocation -> {
            ListingPhotoBlob photo = invocation.getArgument(0);
            stored.put(photo.getObjectKey(), photo);
            return photo;
        });
        when(photos.findById(any(String.class))).thenAnswer(invocation ->
                Optional.ofNullable(stored.get(invocation.getArgument(0))));
        when(cloudinary.download(anyString(), anyString())).thenReturn(PNG);
        storage = new ListingImageStorage(photos, cloudinary, legacyS3, "", legacyDirectory.toString());
    }

    @Test
    void storesMultiplePhotosInCloudinaryAndPersistsOnlyMetadata() {
        var first = new MockMultipartFile("files", "../../unsafe.png", "image/png", PNG);
        var second = new MockMultipartFile("files", "another.png", "image/png", PNG);

        List<String> urls = storage.store(List.of(first, second));

        assertEquals(2, urls.size());
        assertTrue(urls.stream().allMatch(url -> url.matches("/api/listings/images/[a-f0-9-]{36}\\.png")));
        assertEquals(2, stored.size());
        verify(cloudinary, times(2)).upload(eq(PNG), anyString());
        for (String url : urls) {
            var read = storage.read(url.substring(url.lastIndexOf('/') + 1));
            assertArrayEquals(PNG, read.bytes());
            assertEquals("image/png", read.contentType());
        }
        verifyNoInteractions(legacyS3);
    }

    @Test
    void rejectsInvalidContentAndUnsafeObjectKeys() {
        var invalid = new MockMultipartFile("files", "fake.png", "image/png", "not image".getBytes());
        assertThrows(RuntimeException.class, () -> storage.store(List.of(invalid)));
        assertThrows(RuntimeException.class, () -> storage.read("../private.png"));
        verifyNoInteractions(photos, legacyS3, cloudinary);
    }

    @Test
    void migratesExistingLocalPhotoIntoDatabaseWithoutChangingItsSourceFile() throws Exception {
        Files.write(legacyDirectory.resolve("old-photo.png"), PNG);
        String url = storage.migrateLegacyFile("old-photo.png");

        assertTrue(url.matches("/api/listings/images/[a-f0-9-]{36}\\.png"));
        assertTrue(Files.exists(legacyDirectory.resolve("old-photo.png")));
        assertArrayEquals(PNG, storage.read(url.substring(url.lastIndexOf('/') + 1)).bytes());
        verify(cloudinary).upload(eq(PNG), anyString());
    }

    @Test
    void canReadPreviouslyStoredS3ImagesWhenLegacyBucketIsConfigured() {
        when(photos.findById(any(String.class))).thenReturn(Optional.empty());
        when(legacyS3.getObjectAsBytes(any(GetObjectRequest.class))).thenReturn(
                ResponseBytes.fromByteArray(GetObjectResponse.builder().contentType("image/png").build(), PNG));
        ListingImageStorage legacyStorage = new ListingImageStorage(photos, cloudinary, legacyS3,
                "legacy-bucket", legacyDirectory.toString());

        var image = legacyStorage.read("00000000-0000-0000-0000-000000000001.png");

        assertArrayEquals(PNG, image.bytes());
        verify(legacyS3).getObjectAsBytes(any(GetObjectRequest.class));
    }

    @Test
    void deletesCloudinaryAssetWhenMetadataPersistenceFails() {
        when(photos.save(any(ListingPhotoBlob.class))).thenThrow(new IllegalStateException("database failure"));
        var file = new MockMultipartFile("files", "photo.png", "image/png", PNG);

        assertThrows(IllegalStateException.class, () -> storage.store(List.of(file)));

        verify(cloudinary).upload(eq(PNG), anyString());
        verify(cloudinary).delete(anyString());
    }
}
