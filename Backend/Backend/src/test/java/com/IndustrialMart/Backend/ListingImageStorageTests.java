package com.IndustrialMart.Backend;

import com.IndustrialMart.Backend.listing.ListingImageStorage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.util.Base64;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ListingImageStorageTests {
    private static final byte[] PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/nXcAAAAASUVORK5CYII=");

    @TempDir Path legacyDirectory;

    @Test
    void uploadsWithGeneratedKeyAndReadsDurableObjectBytes() {
        S3Client s3 = mock(S3Client.class);
        ListingImageStorage storage = new ListingImageStorage(s3, "listing-photos-test");
        MockMultipartFile upload = new MockMultipartFile("files", "../../unsafe.png", "image/png", PNG);

        String url = storage.store(List.of(upload)).getFirst();
        assertTrue(url.matches("/api/listings/images/[a-f0-9-]{36}\\.png"));
        verify(s3).putObject(any(software.amazon.awssdk.services.s3.model.PutObjectRequest.class),
                any(software.amazon.awssdk.core.sync.RequestBody.class));

        when(s3.getObjectAsBytes(any(GetObjectRequest.class))).thenReturn(
                ResponseBytes.fromByteArray(GetObjectResponse.builder().contentType("image/png").build(), PNG));
        var read = storage.read(url.substring(url.lastIndexOf('/') + 1));
        assertArrayEquals(PNG, read.bytes());
        assertEquals("image/png", read.contentType());
    }

    @Test
    void rejectsInvalidContentAndUnsafeObjectKeys() {
        S3Client s3 = mock(S3Client.class);
        ListingImageStorage storage = new ListingImageStorage(s3, "listing-photos-test");
        MockMultipartFile invalid = new MockMultipartFile("files", "fake.png", "image/png", "not image".getBytes());
        assertThrows(RuntimeException.class, () -> storage.store(List.of(invalid)));
        assertThrows(RuntimeException.class, () -> storage.read("../private.png"));
        verifyNoInteractions(s3);
    }

    @Test
    void missingBucketFailsClosedInsteadOfFallingBackToEphemeralDisk() {
        ListingImageStorage storage = new ListingImageStorage(mock(S3Client.class), " ");
        MockMultipartFile valid = new MockMultipartFile("files", "file.png", "image/png", PNG);
        assertThrows(RuntimeException.class, () -> storage.store(List.of(valid)));
    }

    @Test
    void migratesExistingLocalPhotoWithoutChangingItsSourceFile() throws Exception {
        S3Client s3 = mock(S3Client.class);
        Files.write(legacyDirectory.resolve("old-photo.png"), PNG);
        ListingImageStorage storage = new ListingImageStorage(s3, "listing-photos-test", legacyDirectory.toString());
        String url = storage.migrateLegacyFile("old-photo.png");
        assertTrue(url.matches("/api/listings/images/[a-f0-9-]{36}\\.png"));
        assertTrue(Files.exists(legacyDirectory.resolve("old-photo.png")));
        verify(s3).putObject(any(software.amazon.awssdk.services.s3.model.PutObjectRequest.class),
                any(software.amazon.awssdk.core.sync.RequestBody.class));
    }
}
