
package com.IndustrialMart.Backend.listing;

import com.IndustrialMart.Backend.user.User;
import com.IndustrialMart.Backend.user.UserRepository;
import com.IndustrialMart.Backend.user.UserRole;
import com.IndustrialMart.Backend.unlock.ListingUnlockRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;
    private final UserRepository userRepository;
    private final ListingImageStorage imageStorage;
    private final ListingUnlockRepository unlockRepository;

    public ListingController(
            ListingService listingService,
            UserRepository userRepository,
            ListingImageStorage imageStorage,
            ListingUnlockRepository unlockRepository
    ) {
        this.listingService = listingService;
        this.userRepository = userRepository;
        this.imageStorage = imageStorage;
        this.unlockRepository = unlockRepository;
    }

    @GetMapping
    public List<ListingSummary> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category
    ) {
        return listingService.getAll(search, category).stream().map(ListingSummary::from).toList();
    }

    @GetMapping("/recent")
    public List<ListingSummary> getRecent() { return listingService.getRecent().stream().map(ListingSummary::from).toList(); }

    @GetMapping("/seller/mine")
    public List<Listing> getSellerListings(Authentication authentication) {
        User seller = getCurrentUser(authentication);
        requireSeller(seller);
        return listingService.getSellerListings(seller.getId());
    }

    @GetMapping("/{id}")
    public ListingSummary getById(Authentication authentication, @PathVariable Long id) {
        User user = getCurrentUser(authentication);
        Listing listing = listingService.getById(id);
        if (listing.getStatus() != ListingStatus.APPROVED
                && user.getRole() != UserRole.ADMIN
                && !(user.getRole() == UserRole.SELLER && user.getId().equals(listing.getSellerUserId()))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found");
        }
        return ListingSummary.from(listing);
    }

    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    public Listing uploadImages(Authentication authentication, @PathVariable Long id,
                                @RequestParam("files") List<MultipartFile> files) {
        User user = getCurrentUser(authentication);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        if (!isAdmin) requireSeller(user);
        listingService.assertCanModify(id, user.getId(), isAdmin);
        List<String> uploaded = imageStorage.store(files);
        try {
            return listingService.addImages(id, user.getId(), isAdmin, uploaded);
        } catch (RuntimeException failure) {
            imageStorage.deleteUploaded(uploaded);
            throw failure;
        }
    }

    @GetMapping("/images/{key}")
    public ResponseEntity<byte[]> getImage(Authentication authentication, @PathVariable String key) {
        User user = getCurrentUser(authentication);
        String imageUrl = "/api/listings/images/" + key;
        authorizePhoto(user, imageUrl);
        ListingImageStorage.StoredImage image = imageStorage.read(key);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(image.contentType()))
                .body(image.bytes());
    }

    private void authorizePhoto(User user, String imageUrl) {
        boolean mayView = listingService.getListingsContainingImage(imageUrl).stream().anyMatch(listing ->
                listing.getStatus() == ListingStatus.APPROVED
                        || user.getRole() == UserRole.ADMIN
                        || user.getRole() == UserRole.SELLER && user.getId().equals(listing.getSellerUserId())
                        || user.getRole() == UserRole.BUYER && listing.getStatus() == ListingStatus.APPROVED
                        && unlockRepository.existsByAccountIdAndListingId(user.getId(), listing.getId()));
        if (!mayView) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
    }

    @GetMapping("/moderation")
    public List<Listing> getModerationQueue() {
        return listingService.getModerationQueue();
    }

    @PutMapping("/{id}/moderation")
    public Listing moderate(
            @PathVariable Long id,
            @Valid @RequestBody ModerationRequest request
    ) {
        return listingService.moderate(
                id, request.status(), request.reason()
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Listing create(
            Authentication authentication,
            @Valid @RequestBody Listing request
    ) {
        User seller = getCurrentUser(authentication);
        requireSeller(seller);

        return listingService.create(
                request,
                seller.getId(),
                seller.getFullName()
        );
    }

    @PutMapping("/{id}")
    public Listing update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody Listing request
    ) {
        User user = getCurrentUser(authentication);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        if (!isAdmin) {
            requireSeller(user);
        }

        return listingService.update(
                id, request, user.getId(), isAdmin
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User user = getCurrentUser(authentication);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        if (!isAdmin) {
            requireSeller(user);
        }

        listingService.delete(id, user.getId(), isAdmin);
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        return userRepository.findByEmailIgnoreCase(
                authentication.getName()
        ).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authenticated user not found"
        ));
    }

    private void requireSeller(User user) {
        if (user.getRole() != UserRole.SELLER) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "A seller account is required"
            );
        }
    }

    public record ModerationRequest(
            @NotNull ListingStatus status,
            @NotBlank String reason
    ) {}
}
