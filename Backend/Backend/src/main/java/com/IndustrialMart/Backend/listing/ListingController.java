
package com.IndustrialMart.Backend.listing;

import com.IndustrialMart.Backend.user.User;
import com.IndustrialMart.Backend.user.UserRepository;
import com.IndustrialMart.Backend.user.UserRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
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

    public ListingController(
            ListingService listingService,
            UserRepository userRepository,
            ListingImageStorage imageStorage
    ) {
        this.listingService = listingService;
        this.userRepository = userRepository;
        this.imageStorage = imageStorage;
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

    @GetMapping("/{id}")
    public ListingSummary getById(@PathVariable Long id) {
        return ListingSummary.from(listingService.getById(id));
    }

    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    public Listing uploadImages(Authentication authentication, @PathVariable Long id,
                                @RequestParam("files") List<MultipartFile> files) {
        User user = getCurrentUser(authentication);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        if (!isAdmin) requireSeller(user);
        listingService.assertCanModify(id, user.getId(), isAdmin);
        return listingService.addImages(id, user.getId(), isAdmin, imageStorage.store(files));
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
