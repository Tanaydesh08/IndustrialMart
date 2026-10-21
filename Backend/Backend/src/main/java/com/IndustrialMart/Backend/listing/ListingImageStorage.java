package com.IndustrialMart.Backend.listing;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.io.ByteArrayInputStream;
import javax.imageio.ImageIO;

@Service
public class ListingImageStorage {
    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    private static final int MAX_FILES = 8;
    private final Path root;

    public ListingImageStorage(@Value("${industrial-mart.storage.listing-images:./uploads/listings}") String directory) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
    }

    public List<String> store(List<MultipartFile> files) {
        if (files == null || files.isEmpty() || files.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select 1 to 8 photos");
        }
        List<String> urls = new ArrayList<>();
        try {
            for (MultipartFile file : files) validateImage(file);
            Files.createDirectories(root);
            for (MultipartFile file : files) {
                String type = file.getContentType();
                String extension = switch (type) { case "image/jpeg" -> ".jpg"; case "image/png" -> ".png"; default -> ".webp"; };
                String name = UUID.randomUUID() + extension;
                Path destination = root.resolve(name).normalize();
                if (!destination.startsWith(root)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
                file.transferTo(destination);
                urls.add("/listing-images/" + name);
            }
            return urls;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Photo upload failed", exception);
        }
    }

    private void validateImage(MultipartFile file) throws IOException {
        String type = file.getContentType();
        if (file.isEmpty() || file.getSize() > MAX_FILE_BYTES || type == null
                || !List.of("image/jpeg", "image/png", "image/webp").contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each photo must be JPG, PNG or WEBP and 5 MB or smaller");
        }
        byte[] bytes = file.getBytes();
        boolean jpeg = bytes.length > 3 && (bytes[0] & 255) == 0xff && (bytes[1] & 255) == 0xd8 && (bytes[2] & 255) == 0xff;
        boolean png = bytes.length > 8 && (bytes[0] & 255) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47;
        boolean webp = bytes.length > 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
        if (!(type.equals("image/jpeg") && jpeg || type.equals("image/png") && png || type.equals("image/webp") && webp)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file is not a valid image");
        }
        if (!webp && ImageIO.read(new ByteArrayInputStream(bytes)) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file is not a valid image");
        }
    }
}
