
package com.IndustrialMart.Backend.unlock;

import com.IndustrialMart.Backend.listing.Listing;
import com.IndustrialMart.Backend.listing.ListingRepository;
import com.IndustrialMart.Backend.listing.ListingStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BuyerListingUnlockService {

    private final ListingRepository listingRepository;
    private final ListingUnlockRepository unlockRepository;

    public BuyerListingUnlockService(
            ListingRepository listingRepository,
            ListingUnlockRepository unlockRepository) {
        this.listingRepository = listingRepository;
        this.unlockRepository = unlockRepository;
    }

    @Transactional(readOnly = true)
    public Listing getUnlockedDetails(Long accountId, Long listingId) {
        validateIds(accountId, listingId);

        if (!unlockRepository.existsByAccountIdAndListingId(
                accountId, listingId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Complete the listing unlock payment to view its details");
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Listing not found"));

        if (listing.getStatus() != ListingStatus.APPROVED) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Listing not found");
        }

        return listing;
    }

    @Transactional(readOnly = true)
    public List<ListingUnlock> getUnlockHistory(Long accountId) {
        if (accountId == null || accountId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid account ID");
        }

        return unlockRepository
                .findByAccountIdOrderByUnlockedAtDesc(accountId);
    }

    private void validateIds(Long accountId, Long listingId) {
        if (accountId == null || accountId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid account ID");
        }

        if (listingId == null || listingId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid listing ID");
        }
    }
}
