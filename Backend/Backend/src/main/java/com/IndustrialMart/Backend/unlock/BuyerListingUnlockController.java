
package com.IndustrialMart.Backend.unlock;

import com.IndustrialMart.Backend.listing.Listing;
import com.IndustrialMart.Backend.user.User;
import com.IndustrialMart.Backend.user.UserRepository;
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

    private Long getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }

        User user = userRepository
                .findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"));

        return user.getId();
    }

    @PostMapping("/listings/{listingId}/unlock")
    @ResponseStatus(HttpStatus.OK)
    public BuyerListingUnlockService.UnlockResponse unlockListing(
            Authentication authentication,
            @PathVariable Long listingId) {

        Long accountId = getAuthenticatedUserId(authentication);

        return unlockService.unlock(accountId, listingId);
    }

    @GetMapping("/listings/{listingId}/details")
    public Listing getListingDetails(
            Authentication authentication,
            @PathVariable Long listingId) {

        Long accountId = getAuthenticatedUserId(authentication);

        return unlockService.getUnlockedDetails(accountId, listingId);
    }

    @GetMapping("/unlocks")
    public List<ListingUnlock> getUnlockHistory(
            Authentication authentication) {

        Long accountId = getAuthenticatedUserId(authentication);

        return unlockService.getUnlockHistory(accountId);
    }
}
