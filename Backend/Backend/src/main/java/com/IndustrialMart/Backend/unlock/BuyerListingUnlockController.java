package com.IndustrialMart.Backend.unlock;

import com.IndustrialMart.Backend.listing.Listing;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prototype/buyer")
public class BuyerListingUnlockController {

    private final BuyerListingUnlockService unlockService;

    public BuyerListingUnlockController(
            BuyerListingUnlockService unlockService) {
        this.unlockService = unlockService;
    }

    @PostMapping("/listings/{listingId}/unlock")
    @ResponseStatus(HttpStatus.OK)
    public BuyerListingUnlockService.UnlockResponse unlockListing(
            @RequestParam Long accountId,
            @PathVariable Long listingId) {

        return unlockService.unlock(accountId, listingId);
    }

    @GetMapping("/listings/{listingId}/details")
    public Listing getListingDetails(
            @RequestParam Long accountId,
            @PathVariable Long listingId) {

        return unlockService.getUnlockedDetails(accountId, listingId);
    }

    @GetMapping("/unlocks")
    public List<ListingUnlock> getUnlockHistory(
            @RequestParam Long accountId) {

        return unlockService.getUnlockHistory(accountId);
    }
}