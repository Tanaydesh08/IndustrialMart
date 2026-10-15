
package com.IndustrialMart.Backend.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.IndustrialMart.Backend.listing.Listing;
import com.IndustrialMart.Backend.listing.ListingRepository;
import com.IndustrialMart.Backend.listing.ListingStatus;


import java.time.LocalDateTime;
import java.util.List;

@Service
public class PrototypePaymentService {

    private final PaymentRepository paymentRepository;
    private final CreditWalletRepository walletRepository;
    private final CreditLedgerRepository ledgerRepository;
    private final ListingRepository listingRepository;

    @Value("${industrial-mart.payment.credit-pack-price-paise:9900}")
    private long packPricePaise;

    @Value("${industrial-mart.payment.credit-pack-credits:10}")
    private int packCredits;

    @Value("${industrial-mart.payment.listing-fee-paise:19900}")
    private long listingFeePaise;

    public PrototypePaymentService(
            PaymentRepository paymentRepository,
            CreditWalletRepository walletRepository,
            CreditLedgerRepository ledgerRepository,
            ListingRepository listingRepository) {

        this.paymentRepository = paymentRepository;
        this.walletRepository = walletRepository;
        this.ledgerRepository = ledgerRepository;
        this.listingRepository = listingRepository;
    }

    @Transactional
    public PaymentTransaction createListingFeePayment(
            Long accountId,
            Long listingId) {

        validateAccount(accountId);

        if (listingId == null || listingId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A valid listing ID is required");
        }

        if (listingFeePaise <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Listing fee configuration is invalid");
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Listing not found"));

        if (listing.getStatus() == ListingStatus.APPROVED
                || listing.getStatus() == ListingStatus.REJECTED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Payment cannot be initiated for this listing status");
        }

        if (paymentRepository.existsByListingIdAndPurposeAndStatus(
                listingId,
                PaymentPurpose.LISTING_FEE,
                PaymentStatus.SUCCESS)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Listing fee has already been paid");
        }

        PaymentTransaction payment = new PaymentTransaction(
                accountId,
                PaymentPurpose.LISTING_FEE,
                listingFeePaise,
                0);

        payment.setListingId(listingId);

        return paymentRepository.save(payment);
    }

    @Transactional
    public PaymentTransaction createCreditPurchase(Long accountId) {
        validateAccount(accountId);

        if (packPricePaise <= 0 || packCredits <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Credit pack configuration is invalid"
            );
        }

        walletRepository.findByAccountId(accountId)
                .orElseGet(() ->
                        walletRepository.save(new CreditWallet(accountId))
                );

        PaymentTransaction payment = new PaymentTransaction(
                accountId,
                PaymentPurpose.CREDIT_PACK,
                packPricePaise,
                packCredits
        );

        return paymentRepository.save(payment);
    }

    @Transactional
    public PaymentTransaction simulatePayment(
            Long accountId,
            Long paymentId,
            boolean success) {
        validateAccount(accountId);

        PaymentTransaction payment =
                paymentRepository.findByIdForUpdate(paymentId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Payment not found"
                        ));

        if (!payment.getAccountId().equals(accountId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Payment not found"
            );
        }

        // Repeated success requests must not grant credits again.
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return payment;
        }

        if (payment.getStatus() == PaymentStatus.FAILED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This payment has already failed"
            );
        }

        if (!success) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setCompletedAt(LocalDateTime.now());
            return paymentRepository.save(payment);
        }

        if (payment.getPurpose() == PaymentPurpose.LISTING_FEE) {

            Long listingId = payment.getListingId();

            if (listingId == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Listing ID is missing from this payment");
            }

            Listing listing = listingRepository.findById(listingId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Listing not found"));

            if (listing.getStatus() == ListingStatus.APPROVED
                    || listing.getStatus() == ListingStatus.REJECTED) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Listing is no longer eligible for payment");
            }

            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setCompletedAt(LocalDateTime.now());

            return paymentRepository.save(payment);
        }

        if (payment.getPurpose() != PaymentPurpose.CREDIT_PACK) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported payment purpose");
        }

        CreditWallet wallet =
                walletRepository.findByAccountIdForUpdate(accountId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Credit wallet not found"
                        ));

        // The ledger uniqueness constraint is a second safeguard.
        if (ledgerRepository.existsByPaymentId(paymentId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Credits have already been granted for this payment"
            );
        }

        wallet.addCredits(payment.getCreditsToGrant());

        ledgerRepository.save(new CreditLedgerEntry(
                accountId,
                payment.getCreditsToGrant(),
                "CREDIT_PURCHASE",
                payment.getId()
        ));

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setCompletedAt(LocalDateTime.now());

        walletRepository.save(wallet);
        return paymentRepository.save(payment);
    }

    @Transactional(readOnly = true)
    public WalletResponse getWallet(Long accountId) {
        validateAccount(accountId);

        CreditWallet wallet = walletRepository
                .findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Credit wallet not found"
                ));

        return new WalletResponse(
                wallet.getAccountId(),
                wallet.getBalance()
        );
    }

    @Transactional(readOnly = true)
    public List<CreditLedgerEntry> getLedger(Long accountId) {
        validateAccount(accountId);

        return ledgerRepository
                .findByAccountIdOrderByCreatedAtDesc(accountId);
    }

    private void validateAccount(Long accountId) {
        if (accountId == null || accountId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A valid prototype account ID is required"
            );
        }
    }

    public record WalletResponse(
            Long accountId,
            Integer balance
    ) {}
}
