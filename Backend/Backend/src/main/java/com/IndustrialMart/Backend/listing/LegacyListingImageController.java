package com.IndustrialMart.Backend.listing;

import com.IndustrialMart.Backend.unlock.ListingUnlockRepository;
import com.IndustrialMart.Backend.user.User;
import com.IndustrialMart.Backend.user.UserRepository;
import com.IndustrialMart.Backend.user.UserRole;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/listing-images")
public class LegacyListingImageController {
    private final ListingService listings;
    private final UserRepository users;
    private final ListingUnlockRepository unlocks;
    private final ListingImageStorage storage;

    public LegacyListingImageController(ListingService listings, UserRepository users,
            ListingUnlockRepository unlocks, ListingImageStorage storage) {
        this.listings = listings;
        this.users = users;
        this.unlocks = unlocks;
        this.storage = storage;
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<byte[]> get(Authentication authentication, @PathVariable String filename) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User user = users.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        String url = "/listing-images/" + filename;
        boolean allowed = listings.getListingsContainingImage(url).stream().anyMatch(listing ->
                listing.getStatus() == ListingStatus.APPROVED
                        || user.getRole() == UserRole.ADMIN
                        || user.getRole() == UserRole.SELLER && user.getId().equals(listing.getSellerUserId()));
        if (!allowed) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        ListingImageStorage.StoredImage image = storage.readLegacy(filename);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(image.contentType())).body(image.bytes());
    }
}
