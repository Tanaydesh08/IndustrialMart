package com.IndustrialMart.Backend;

import com.IndustrialMart.Backend.listing.ListingImageStorage;
import com.IndustrialMart.Backend.listing.CloudinaryAssetClient;
import com.IndustrialMart.Backend.listing.ListingPhotoBlobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class ListingPhotoDatabaseTests {
    private static final byte[] PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/nXcAAAAASUVORK5CYII=");

    @Autowired ListingImageStorage storage;
    @Autowired ListingPhotoBlobRepository photos;
    @MockitoBean CloudinaryAssetClient cloudinary;

    @Test
    void photoMetadataPersistsInTheRelationalDatabaseWhileBytesStayInCloudinary() {
        org.mockito.Mockito.when(cloudinary.download(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString())).thenReturn(PNG);
        String url = storage.store(List.of(new MockMultipartFile(
                "files", "photo.png", "image/png", PNG))).getFirst();
        String key = url.substring(url.lastIndexOf('/') + 1);

        var persisted = photos.findById(key).orElseThrow();
        assertNotNull(persisted.getCloudinaryPublicId());
        org.mockito.Mockito.verify(cloudinary).upload(org.mockito.ArgumentMatchers.eq(PNG),
                org.mockito.ArgumentMatchers.anyString());
        var retrieved = storage.read(key);
        assertArrayEquals(PNG, retrieved.bytes());
        assertEquals("image/png", retrieved.contentType());

        photos.deleteById(key);
    }
}
