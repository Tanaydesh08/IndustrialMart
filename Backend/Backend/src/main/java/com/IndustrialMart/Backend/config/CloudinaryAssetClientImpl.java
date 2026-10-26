package com.IndustrialMart.Backend.config;

import com.cloudinary.Cloudinary;
import com.IndustrialMart.Backend.listing.CloudinaryAssetClient;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

final class CloudinaryAssetClientImpl implements CloudinaryAssetClient {
    private final Cloudinary cloudinary;
    private final boolean configured;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    CloudinaryAssetClientImpl(Cloudinary cloudinary, boolean configured) {
        this.cloudinary = cloudinary;
        this.configured = configured;
    }

    @Override
    public void upload(byte[] bytes, String publicId) {
        requireConfigured();
        try {
            cloudinary.uploader().upload(bytes, Map.of(
                    "resource_type", "image", "type", "authenticated", "public_id", publicId,
                    "overwrite", false, "invalidate", true));
        } catch (Exception failure) {
            throw new IllegalStateException("Cloudinary image upload failed", failure);
        }
    }

    @Override
    public byte[] download(String publicId, String format) {
        requireConfigured();
        try {
            String signedUrl = cloudinary.privateDownload(publicId, format,
                    Map.of("type", "authenticated", "expires_at", System.currentTimeMillis() / 1000 + 120));
            HttpRequest request = HttpRequest.newBuilder(URI.create(signedUrl))
                    .timeout(Duration.ofSeconds(20)).GET().build();
            HttpResponse<byte[]> response = http.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) throw new IllegalStateException("Cloudinary image retrieval failed");
            return response.body();
        } catch (Exception failure) {
            throw new IllegalStateException("Cloudinary image retrieval failed", failure);
        }
    }

    @Override
    public void delete(String publicId) {
        requireConfigured();
        try {
            cloudinary.uploader().destroy(publicId, Map.of("resource_type", "image", "type", "authenticated"));
        } catch (Exception failure) {
            throw new IllegalStateException("Cloudinary image cleanup failed", failure);
        }
    }

    private void requireConfigured() {
        if (!configured) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Photo storage is not configured. Set the Cloudinary backend variables.");
    }
}
