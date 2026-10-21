package com.IndustrialMart.Backend.unlock;

import com.IndustrialMart.Backend.listing.Listing;
import com.IndustrialMart.Backend.user.User;
import com.IndustrialMart.Backend.user.UserRepository;
import com.IndustrialMart.Backend.user.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/prototype/buyer")
public class BuyerListingUnlockController {

    private final BuyerListingUnlockService unlockService;
    private final UserRepository userRepository;

    public BuyerListingUnlockController(
            BuyerListingUnlockService unlockService,
            UserRepository userRepository) {
        this.unlockService = unlockService;
        this.userRepository = userRepository;
    }

    private Long getAuthenticatedBuyerId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        if (user.getRole() != UserRole.BUYER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Buyer role required");
        }
        return user.getId();
    }

    // Unlocks are granted only by a successful LISTING_UNLOCK payment.
    // The old direct-unlock endpoint is intentionally removed to prevent bypassing payment.

    @GetMapping("/listings/{listingId}/details")
    public Listing getListingDetails(
            Authentication authentication,
            @PathVariable Long listingId) {
        return unlockService.getUnlockedDetails(getAuthenticatedBuyerId(authentication), listingId);
    }

    @GetMapping("/unlocks")
    public List<ListingUnlock> getUnlockHistory(Authentication authentication) {
        return unlockService.getUnlockHistory(getAuthenticatedBuyerId(authentication));
    }
}
