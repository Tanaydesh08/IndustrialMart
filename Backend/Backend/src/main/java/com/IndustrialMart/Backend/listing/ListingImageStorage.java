package com.IndustrialMart.Backend.listing;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

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
    private static final String IMAGE_URL_PREFIX = "/api/listings/images/";

    private final ListingPhotoBlobRepository photos;
    private final CloudinaryAssetClient cloudinary;
    private final S3Client legacyS3;
    private final String legacyBucket;
    private final String legacyDirectory;

    public ListingImageStorage(ListingPhotoBlobRepository photos, CloudinaryAssetClient cloudinary, S3Client legacyS3,
            @Value("${industrial-mart.storage.s3.bucket:}") String legacyBucket,
            @Value("${industrial-mart.storage.listing-images:./uploads/listings}") String legacyDirectory) {
        this.photos = photos;
        this.cloudinary = cloudinary;
        this.legacyS3 = legacyS3;
        this.legacyBucket = legacyBucket == null ? "" : legacyBucket.trim();
        this.legacyDirectory = legacyDirectory;
    }

    @Transactional
    public List<String> store(List<MultipartFile> files) {
        if (files == null || files.isEmpty() || files.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select 1 to 8 photos");
        }
        List<Photo> validated = files.stream().map(this::validateImage).toList();
        List<String> urls = new ArrayList<>(validated.size());
        List<String> uploadedPublicIds = new ArrayList<>();
        try {
            for (Photo photo : validated) urls.add(save(photo, uploadedPublicIds));
            return urls;
        } catch (RuntimeException failure) {
            for (String publicId : uploadedPublicIds) {
                try { cloudinary.delete(publicId); } catch (RuntimeException ignored) { /* cleanup is best effort */ }
            }
            photos.deleteAllById(urls.stream().map(this::keyFromUrl).toList());
            throw failure;
        }
    }

    public String storeSponsored(MultipartFile file) {
        String listingUrl = store(List.of(file)).get(0);
        return listingUrl.replace(IMAGE_URL_PREFIX, "/api/sponsored-ads/images/");
    }

    public String migrateLegacyFile(String filename) {
        if (filename == null || !filename.matches("[a-zA-Z0-9-]{1,100}\\.(jpg|jpeg|png|webp)")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Legacy photo name is invalid");
        }
        try {
            Path root = Path.of(legacyDirectory).toAbsolutePath().normalize();
            Path file = root.resolve(filename).normalize();
            if (!file.startsWith(root) || !Files.isRegularFile(file)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Legacy photo file is missing");
            }
            String type = contentType(filename);
            return save(validateBytes(Files.readAllBytes(file), type), new ArrayList<>());
        } catch (IOException failure) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Legacy photo could not be read", failure);
        }
    }

    @Transactional(readOnly = true)
    public StoredImage read(String key) {
        if (key == null || !OBJECT_KEY.matcher(key).matches()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }
        var stored = photos.findById(key);
        if (stored.isPresent()) {
            ListingPhotoBlob photo = stored.get();
            try {
                byte[] bytes = cloudinary.download(photo.getCloudinaryPublicId(), photo.getFormat());
                validateBytes(bytes, photo.getContentType());
                return new StoredImage(bytes, photo.getContentType());
            } catch (IOException failure) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Photo storage returned an invalid image", failure);
            } catch (ResponseStatusException failure) {
                throw failure;
            } catch (RuntimeException failure) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Photo storage could not retrieve the image", failure);
            }
        }
        // Backward compatibility for assets uploaded to S3 by a previous deployment.
        if (legacyBucket.isBlank()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        try {
            ResponseBytes<GetObjectResponse> response = legacyS3.getObjectAsBytes(
                    GetObjectRequest.builder().bucket(legacyBucket).key(key).build());
            String type = response.response().contentType();
            if (!List.of("image/jpeg", "image/png", "image/webp").contains(type)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
            }
            return new StoredImage(response.asByteArray(), type);
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
            String type = contentType(filename);
            return new StoredImage(Files.readAllBytes(file), type);
        } catch (IOException failure) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found", failure);
        }
    }

    @Transactional
    public void deleteUploaded(List<String> urls) {
        if (urls == null) return;
        List<String> keys = urls.stream().filter(url -> url != null && url.startsWith(IMAGE_URL_PREFIX))
                .map(this::keyFromUrl).filter(key -> OBJECT_KEY.matcher(key).matches()).toList();
        for (String key : keys) {
            photos.findById(key).ifPresent(photo -> cloudinary.delete(photo.getCloudinaryPublicId()));
        }
        photos.deleteAllById(keys);
    }

    private String save(Photo photo, List<String> uploadedPublicIds) {
        String key = UUID.randomUUID() + photo.extension();
        String publicId = "industrial-mart/listings/" + UUID.randomUUID();
        cloudinary.upload(photo.bytes(), publicId);
        uploadedPublicIds.add(publicId);
        photos.save(new ListingPhotoBlob(key, publicId, photo.contentType(), photo.extension().substring(1)));
        return IMAGE_URL_PREFIX + key;
    }

    private String keyFromUrl(String url) { return url.substring(IMAGE_URL_PREFIX.length()); }

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

    private String contentType(String filename) {
        return switch (filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            default -> "image/webp";
        };
    }

    private record Photo(byte[] bytes, String contentType, String extension) {}
    public record StoredImage(byte[] bytes, String contentType) {}
}
