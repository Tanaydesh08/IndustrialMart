package com.IndustrialMart.Backend.listing;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ListingImageStorage {
    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    private static final int MAX_FILES = 8;
    private static final Pattern OBJECT_KEY = Pattern.compile("[a-f0-9-]{36}\\.(jpg|png|webp)");
    private final S3Client s3;
    private final String bucket;
    @Value("${industrial-mart.storage.listing-images:./uploads/listings}")
    private String legacyDirectory;

    @Autowired
    public ListingImageStorage(S3Client s3,
            @Value("${industrial-mart.storage.s3.bucket:}") String bucket) {
        this(s3, bucket, "./uploads/listings");
    }

    public ListingImageStorage(S3Client s3, String bucket, String legacyDirectory) {
        this.s3 = s3;
        this.bucket = bucket == null ? "" : bucket.trim();
        this.legacyDirectory = legacyDirectory;
    }

    public List<String> store(List<MultipartFile> files) {
        if (files == null || files.isEmpty() || files.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select 1 to 8 photos");
        }
        requireBucket();
        List<Photo> validated = files.stream().map(this::validateImage).toList();
        List<String> storedKeys = new ArrayList<>();
        try {
            for (Photo photo : validated) storedKeys.add(upload(photo));
            return storedKeys.stream().map(key -> "/api/listings/images/" + key).toList();
        } catch (RuntimeException failure) {
            deleteKeys(storedKeys);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Photo upload failed. Please retry.", failure);
        }
    }

    public String migrateLegacyFile(String filename) {
        requireBucket();
        if (filename == null || !filename.matches("[a-zA-Z0-9-]{1,100}\\.(jpg|jpeg|png|webp)")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Legacy photo name is invalid");
        }
        try {
            Path root = Path.of(legacyDirectory).toAbsolutePath().normalize();
            Path file = root.resolve(filename).normalize();
            if (!file.startsWith(root) || !Files.isRegularFile(file)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Legacy photo file is missing");
            }
            String type = switch (filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()) {
                case "jpg", "jpeg" -> "image/jpeg"; case "png" -> "image/png"; default -> "image/webp";
            };
            String key = upload(validateBytes(Files.readAllBytes(file), type));
            return "/api/listings/images/" + key;
        } catch (IOException failure) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Legacy photo could not be migrated", failure);
        }
    }

    public StoredImage read(String key) {
        requireBucket();
        if (key == null || !OBJECT_KEY.matcher(key).matches()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }
        try {
            ResponseBytes<GetObjectResponse> response = s3.getObjectAsBytes(
                    GetObjectRequest.builder().bucket(bucket).key(key).build());
            String contentType = response.response().contentType();
            if (!List.of("image/jpeg", "image/png", "image/webp").contains(contentType)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
            }
            return new StoredImage(response.asByteArray(), contentType);
        } catch (NoSuchKeyException missing) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }
    }

    public StoredImage readLegacy(String filename) {
        if (filename == null || !filename.matches("[a-zA-Z0-9-]{1,100}\\.(jpg|jpeg|png|webp)")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }
        try {
            Path root = Path.of(legacyDirectory).toAbsolutePath().normalize();
            Path file = root.resolve(filename).normalize();
            if (!file.startsWith(root) || !Files.isRegularFile(file)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
            }
            String type = switch (filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()) {
                case "jpg", "jpeg" -> "image/jpeg";
                case "png" -> "image/png";
                default -> "image/webp";
            };
            return new StoredImage(Files.readAllBytes(file), type);
        } catch (IOException failure) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found", failure);
        }
    }

    public void deleteUploaded(List<String> urls) {
        if (urls == null) return;
        List<String> keys = urls.stream()
                .filter(url -> url != null && url.startsWith("/api/listings/images/"))
                .map(url -> url.substring("/api/listings/images/".length()))
                .filter(key -> OBJECT_KEY.matcher(key).matches()).toList();
        deleteKeys(keys);
    }

    private void deleteKeys(List<String> keys) {
        for (String key : keys) {
            try {
                s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
            } catch (RuntimeException ignored) {
                // Cleanup is best effort; the primary upload/database error remains actionable.
            }
        }
    }

    private Photo validateImage(MultipartFile file) {
        try {
            String type = file.getContentType();
            if (file.isEmpty() || file.getSize() > MAX_FILE_BYTES || type == null
                    || !List.of("image/jpeg", "image/png", "image/webp").contains(type)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Each photo must be JPG, PNG or WEBP and 5 MB or smaller");
            }
            return validateBytes(file.getBytes(), type);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the selected image", exception);
        }
    }

    private Photo validateBytes(byte[] bytes, String type) throws IOException {
        if (bytes.length == 0 || bytes.length > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each photo must be 5 MB or smaller");
        }
        boolean jpeg = bytes.length > 3 && (bytes[0] & 255) == 0xff && (bytes[1] & 255) == 0xd8 && (bytes[2] & 255) == 0xff;
        boolean png = bytes.length > 8 && (bytes[0] & 255) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47;
        boolean webp = bytes.length > 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
        boolean validSignature = type.equals("image/jpeg") && jpeg || type.equals("image/png") && png || type.equals("image/webp") && webp;
        if (!validSignature || !webp && ImageIO.read(new ByteArrayInputStream(bytes)) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file is not a valid image");
        }
        String extension = switch (type) { case "image/jpeg" -> ".jpg"; case "image/png" -> ".png"; default -> ".webp"; };
        return new Photo(bytes, type, extension);
    }

    private String upload(Photo photo) {
        String key = UUID.randomUUID() + photo.extension();
        try {
            s3.putObject(PutObjectRequest.builder().bucket(bucket).key(key)
                    .contentType(photo.contentType()).contentLength((long) photo.bytes().length)
                    .build(), RequestBody.fromBytes(photo.bytes()));
        } catch (RuntimeException failure) {
            deleteKeys(List.of(key));
            throw failure;
        }
        return key;
    }

    private void requireBucket() {
        if (bucket.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Durable photo storage is not configured. Contact the site administrator.");
        }
    }

    private record Photo(byte[] bytes, String contentType, String extension) {}
    public record StoredImage(byte[] bytes, String contentType) {}
}
