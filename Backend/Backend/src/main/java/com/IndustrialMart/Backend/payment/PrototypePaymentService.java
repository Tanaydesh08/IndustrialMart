package com.IndustrialMart.Backend.payment;

import com.IndustrialMart.Backend.listing.Listing;
import com.IndustrialMart.Backend.listing.ListingRepository;
import com.IndustrialMart.Backend.listing.ListingStatus;
import com.IndustrialMart.Backend.unlock.ListingUnlock;
import com.IndustrialMart.Backend.unlock.ListingUnlockRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PrototypePaymentService {

    private final PaymentRepository paymentRepository;
    private final CreditWalletRepository walletRepository;
    private final CreditLedgerRepository ledgerRepository;
    private final ListingRepository listingRepository;
    private final ListingUnlockRepository unlockRepository;

    @Value("${industrial-mart.payment.listing-unlock-price-paise:9900}")
    private long listingUnlockPricePaise;

    @Value("${industrial-mart.payment.listing-fee-paise:19900}")
    private long listingFeePaise;

    public PrototypePaymentService(
            PaymentRepository paymentRepository,
            CreditWalletRepository walletRepository,
            CreditLedgerRepository ledgerRepository,
            ListingRepository listingRepository,
            ListingUnlockRepository unlockRepository) {
        this.paymentRepository = paymentRepository;
        this.walletRepository = walletRepository;
        this.ledgerRepository = ledgerRepository;
        this.listingRepository = listingRepository;
        this.unlockRepository = unlockRepository;
    }

    @Transactional
    public PaymentTransaction createListingUnlockPayment(Long accountId, Long listingId) {
        validateAccount(accountId);
        validateListingId(listingId);
        if (listingUnlockPricePaise != 9900L) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Listing unlock price must be ₹99 (9900 paise)");
        }

        Listing listing = findApprovedListing(listingId);
        if (listing.getSellerUserId() != null && listing.getSellerUserId().equals(accountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You cannot purchase access to your own listing");
        }
        if (unlockRepository.existsByAccountIdAndListingId(accountId, listingId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You have already unlocked this listing");
        }

        var pending = paymentRepository
                .findFirstByAccountIdAndListingIdAndPurposeAndStatusInOrderByCreatedAtDesc(
                        accountId, listingId, PaymentPurpose.LISTING_UNLOCK,
                        List.of(PaymentStatus.PENDING));
        if (pending.isPresent()) {
            return pending.get();
        }

        PaymentTransaction payment = new PaymentTransaction(
                accountId, PaymentPurpose.LISTING_UNLOCK, 9900L, 0);
        payment.setListingId(listingId);
        return paymentRepository.save(payment);
    }

    @Transactional
    public PaymentTransaction createListingFeePayment(Long accountId, Long listingId) {
        validateAccount(accountId);
        validateListingId(listingId);
        if (listingFeePaise <= 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Listing fee configuration is invalid");
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        verifyListingOwnership(listing, accountId);

        if (listing.getStatus() == ListingStatus.APPROVED
                || listing.getStatus() == ListingStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Payment cannot be initiated for this listing status");
        }
        if (paymentRepository.existsByListingIdAndPurposeAndStatus(
                listingId, PaymentPurpose.LISTING_FEE, PaymentStatus.SUCCESS)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Listing fee has already been paid");
        }

        PaymentTransaction payment = new PaymentTransaction(
                accountId, PaymentPurpose.LISTING_FEE, listingFeePaise, 0);
        payment.setListingId(listingId);
        return paymentRepository.save(payment);
    }

    /**
     * Prototype-only payment simulation; this is not real payment verification.
     */
    @Transactional
    public PaymentTransaction simulatePayment(Long accountId, Long paymentId, boolean success) {
        validateAccount(accountId);
        if (paymentId == null || paymentId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid payment ID is required");
        }

        PaymentTransaction payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (!payment.getAccountId().equals(accountId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found");
        }
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return payment;
        }
        if (payment.getStatus() == PaymentStatus.FAILED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This payment has already failed");
        }

        if (!success) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setCompletedAt(LocalDateTime.now());
            return paymentRepository.save(payment);
        }

        switch (payment.getPurpose()) {
            case LISTING_FEE -> completeListingFeePayment(payment, accountId);
            case LISTING_UNLOCK -> completeListingUnlockPayment(payment, accountId);
            case CREDIT_PACK -> throw new ResponseStatusException(HttpStatus.GONE,
                    "Credit-pack purchases are no longer available");
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment purpose");
        }
        return paymentRepository.save(payment);
    }

    private void completeListingFeePayment(PaymentTransaction payment, Long accountId) {
        Long listingId = payment.getListingId();
        if (listingId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Listing ID is missing from this payment");
        }
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        verifyListingOwnership(listing, accountId);
        if (listing.getStatus() == ListingStatus.APPROVED || listing.getStatus() == ListingStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Listing is no longer eligible for payment");
        }
        if (paymentRepository.existsByListingIdAndPurposeAndStatus(
                listingId, PaymentPurpose.LISTING_FEE, PaymentStatus.SUCCESS)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Listing fee has already been paid");
        }
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setCompletedAt(LocalDateTime.now());
    }

    private void completeListingUnlockPayment(PaymentTransaction payment, Long accountId) {
        Long listingId = payment.getListingId();
        if (listingId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Listing ID is missing from this payment");
        }
        if (payment.getAmountPaise() == null || payment.getAmountPaise() != 9900L) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid amount for listing unlock payment");
        }

        findApprovedListing(listingId);
        Listing listing = listingRepository.findById(listingId).orElseThrow();
        if (listing.getSellerUserId() != null && listing.getSellerUserId().equals(accountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You cannot purchase access to your own listing");
        }

        if (!unlockRepository.existsByAccountIdAndListingId(accountId, listingId)) {
            unlockRepository.save(new ListingUnlock(accountId, listingId));
        }
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setCompletedAt(LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public WalletResponse getWallet(Long accountId) {
        validateAccount(accountId);
        CreditWallet wallet = walletRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Credit wallet not found"));
        return new WalletResponse(wallet.getAccountId(), wallet.getBalance());
    }

    @Transactional(readOnly = true)
    public List<CreditLedgerEntry> getLedger(Long accountId) {
        validateAccount(accountId);
        return ledgerRepository.findByAccountIdOrderByCreatedAtDesc(accountId);
    }

    private Listing findApprovedListing(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        if (listing.getStatus() != ListingStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only approved listings can be unlocked");
        }
        return listing;
    }

    private void verifyListingOwnership(Listing listing, Long accountId) {
        if (listing.getSellerUserId() == null || !listing.getSellerUserId().equals(accountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only pay the listing fee for your own listing");
        }
    }

    private void validateAccount(Long accountId) {
        if (accountId == null || accountId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid account ID is required");
        }
    }

    private void validateListingId(Long listingId) {
        if (listingId == null || listingId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid listing ID is required");
        }
    }

    public record WalletResponse(Long accountId, Integer balance) {}
}
