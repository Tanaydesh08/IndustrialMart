
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

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;
    private final UserRepository userRepository;

    public ListingController(
            ListingService listingService,
            UserRepository userRepository
    ) {
        this.listingService = listingService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Listing> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category
    ) {
        return listingService.getAll(search, category);
    }

    @GetMapping("/{id}")
    public Listing getById(@PathVariable Long id) {
        return listingService.getById(id);
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
