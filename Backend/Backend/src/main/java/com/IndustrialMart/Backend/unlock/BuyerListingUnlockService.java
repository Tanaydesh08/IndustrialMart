package com.IndustrialMart.Backend.unlock;

import com.IndustrialMart.Backend.listing.Listing;
import com.IndustrialMart.Backend.listing.ListingRepository;
import com.IndustrialMart.Backend.listing.ListingStatus;
import com.IndustrialMart.Backend.payment.CreditLedgerEntry;
import com.IndustrialMart.Backend.payment.CreditLedgerRepository;
import com.IndustrialMart.Backend.payment.CreditWallet;
import com.IndustrialMart.Backend.payment.CreditWalletRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BuyerListingUnlockService {

    private static final int UNLOCK_COST = 1;

    private final ListingRepository listingRepository;
    private final CreditWalletRepository walletRepository;
    private final CreditLedgerRepository ledgerRepository;
    private final ListingUnlockRepository unlockRepository;

    public BuyerListingUnlockService(
            ListingRepository listingRepository,
            CreditWalletRepository walletRepository,
            CreditLedgerRepository ledgerRepository,
            ListingUnlockRepository unlockRepository) {
        this.listingRepository = listingRepository;
        this.walletRepository = walletRepository;
        this.ledgerRepository = ledgerRepository;
        this.unlockRepository = unlockRepository;
    }

    @Transactional
    public UnlockResponse unlock(Long accountId, Long listingId) {

        validateIds(accountId, listingId);

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Listing not found"));

        if (listing.getStatus() != ListingStatus.APPROVED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only approved listings can be unlocked");
        }

        // Lock this account's wallet before checking and changing its balance.
        CreditWallet wallet = walletRepository
                .findByAccountIdForUpdate(accountId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Credit wallet not found. Purchase a credit pack first."));

        // Repeat access must never charge a second credit.
        var existing = unlockRepository
                .findByAccountIdAndListingId(accountId, listingId);

        if (existing.isPresent()) {
            return new UnlockResponse(
                    true,
                    false,
                    0,
                    wallet.getBalance(),
                    existing.get().getUnlockedAt()
            );
        }

        if (wallet.getBalance() < UNLOCK_COST) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Insufficient credits. One credit is required.");
        }

        // All changes below participate in the same database transaction.
        wallet.spendCredits(UNLOCK_COST);

        ListingUnlock unlock =
                unlockRepository.save(new ListingUnlock(accountId, listingId));

        ledgerRepository.save(new CreditLedgerEntry(
                accountId,
                -UNLOCK_COST,
                "LISTING_UNLOCK",
                null,
                listingId
        ));

        walletRepository.save(wallet);

        return new UnlockResponse(
                true,
                true,
                UNLOCK_COST,
                wallet.getBalance(),
                unlock.getUnlockedAt()
        );
    }

    @Transactional(readOnly = true)
    public Listing getUnlockedDetails(Long accountId, Long listingId) {

        validateIds(accountId, listingId);

        if (!unlockRepository.existsByAccountIdAndListingId(
                accountId, listingId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Unlock this listing with one credit to view its details");
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

    public record UnlockResponse(
            boolean unlocked,
            boolean charged,
            int creditsCharged,
            int remainingCredits,
            LocalDateTime unlockedAt) {
    }
}