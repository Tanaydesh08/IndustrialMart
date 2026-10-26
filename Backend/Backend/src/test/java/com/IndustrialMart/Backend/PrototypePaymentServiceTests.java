package com.IndustrialMart.Backend;

import com.IndustrialMart.Backend.listing.Listing;
import com.IndustrialMart.Backend.listing.ListingRepository;
import com.IndustrialMart.Backend.listing.ListingStatus;
import com.IndustrialMart.Backend.payment.PaymentPurpose;
import com.IndustrialMart.Backend.payment.PaymentStatus;
import com.IndustrialMart.Backend.payment.PaymentRepository;
import com.IndustrialMart.Backend.payment.PrototypePaymentService;
import com.IndustrialMart.Backend.unlock.BuyerListingUnlockService;
import com.IndustrialMart.Backend.unlock.ListingUnlockRepository;
import com.IndustrialMart.Backend.user.User;
import com.IndustrialMart.Backend.user.UserRepository;
import com.IndustrialMart.Backend.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class PrototypePaymentServiceTests {
    @Autowired PrototypePaymentService payments;
    @Autowired BuyerListingUnlockService unlocks;
    @Autowired ListingRepository listings;
    @Autowired UserRepository users;
    @Autowired PaymentRepository transactions;
    @Autowired ListingUnlockRepository entitlements;

    private User buyer;
    private User otherBuyer;
    private User seller;
    private Listing approvedListing;
    private Listing pendingListing;

    @BeforeEach
    void setup() {
        String suffix = UUID.randomUUID().toString();
        buyer = users.saveAndFlush(new User("Buyer One", "buyer-one-" + suffix + "@test.invalid", "hash", UserRole.BUYER));
        otherBuyer = users.saveAndFlush(new User("Buyer Two", "buyer-two-" + suffix + "@test.invalid", "hash", UserRole.BUYER));
        seller = users.saveAndFlush(new User("Seller", "seller-" + suffix + "@test.invalid", "hash", UserRole.SELLER));
        approvedListing = saveListing("approved", ListingStatus.APPROVED, seller.getId());
        pendingListing = saveListing("pending", ListingStatus.PENDING_REVIEW, seller.getId());
    }

    @Test
    void buyerUnlockPersistsCorrectPricePurposeOwnerAndPerBuyerEntitlement() {
        var created = payments.createListingUnlockPayment(buyer.getId(), approvedListing.getId());
        assertEquals(9900L, created.getAmountPaise());
        assertEquals(PaymentPurpose.LISTING_UNLOCK, created.getPurpose());
        assertEquals(approvedListing.getId(), created.getListingId());
        assertEquals(buyer.getId(), created.getAccountId());
        assertSamePayment(created.getId(), payments.createListingUnlockPayment(buyer.getId(), approvedListing.getId()).getId());

        var paid = payments.simulatePayment(buyer.getId(), created.getId(), true);
        assertEquals(PaymentStatus.SUCCESS, paid.getStatus());
        assertTrue(entitlements.existsByAccountIdAndListingId(buyer.getId(), approvedListing.getId()));
        assertEquals(approvedListing.getId(), unlocks.getUnlockedDetails(buyer.getId(), approvedListing.getId()).getId());
        assertThrows(ResponseStatusException.class, () -> unlocks.getUnlockedDetails(otherBuyer.getId(), approvedListing.getId()));

        var otherPayment = payments.createListingUnlockPayment(otherBuyer.getId(), approvedListing.getId());
        assertNotEquals(created.getId(), otherPayment.getId());
        assertEquals(PaymentStatus.SUCCESS, payments.simulatePayment(otherBuyer.getId(), otherPayment.getId(), true).getStatus());
        assertEquals(2, transactions.findAll().stream().filter(p -> p.getListingId().equals(approvedListing.getId())
                && p.getPurpose() == PaymentPurpose.LISTING_UNLOCK && p.getStatus() == PaymentStatus.SUCCESS).count());
        assertThrows(ResponseStatusException.class, () -> payments.createListingUnlockPayment(buyer.getId(), approvedListing.getId()));
    }

    @Test
    void failedUnlockDoesNotGrantAccessAndPaymentIdentityCannotBeReused() {
        var payment = payments.createListingUnlockPayment(buyer.getId(), approvedListing.getId());
        assertEquals(PaymentStatus.FAILED, payments.simulatePayment(buyer.getId(), payment.getId(), false).getStatus());
        assertFalse(entitlements.existsByAccountIdAndListingId(buyer.getId(), approvedListing.getId()));
        assertThrows(ResponseStatusException.class, () -> unlocks.getUnlockedDetails(buyer.getId(), approvedListing.getId()));
        assertThrows(ResponseStatusException.class, () -> payments.simulatePayment(otherBuyer.getId(), payment.getId(), true));
    }

    @Test
    void sellerFeeUsesConfiguredAmountAndDoesNotApproveListing() {
        var payment = payments.createListingFeePayment(seller.getId(), pendingListing.getId());
        assertEquals(19900L, payment.getAmountPaise());
        assertEquals(PaymentPurpose.LISTING_FEE, payment.getPurpose());
        assertEquals(seller.getId(), payment.getAccountId());
        assertEquals(pendingListing.getId(), payment.getListingId());
        assertEquals(PaymentStatus.SUCCESS, payments.simulatePayment(seller.getId(), payment.getId(), true).getStatus());
        assertEquals(ListingStatus.PENDING_REVIEW, listings.findById(pendingListing.getId()).orElseThrow().getStatus());
        assertThrows(ResponseStatusException.class, () -> payments.createListingFeePayment(buyer.getId(), pendingListing.getId()));
        assertThrows(ResponseStatusException.class, () -> payments.createListingFeePayment(otherBuyer.getId(), pendingListing.getId()));
    }

    @Test
    void failedSellerPaymentDoesNotRecordSuccessAndDuplicatePendingRequestIsIdempotent() {
        var pending = payments.createListingFeePayment(seller.getId(), pendingListing.getId());
        assertEquals(pending.getId(), payments.createListingFeePayment(seller.getId(), pendingListing.getId()).getId());
        assertEquals(PaymentStatus.FAILED, payments.simulatePayment(seller.getId(), pending.getId(), false).getStatus());
        assertFalse(transactions.existsByListingIdAndPurposeAndStatus(pendingListing.getId(), PaymentPurpose.LISTING_FEE, PaymentStatus.SUCCESS));
    }

    @Test
    void nonApprovedListingCannotBeUnlocked() {
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> payments.createListingUnlockPayment(buyer.getId(), pendingListing.getId())).getStatusCode());
    }

    @Test
    void concurrentRetriesReuseOnePendingPaymentAndOneUnlock() throws Exception {
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> payments.createListingUnlockPayment(buyer.getId(), approvedListing.getId()));
            var second = pool.submit(() -> payments.createListingUnlockPayment(buyer.getId(), approvedListing.getId()));
            var paymentA = first.get();
            var paymentB = second.get();
            assertEquals(paymentA.getId(), paymentB.getId());

            var attemptA = pool.submit(() -> payments.simulatePayment(buyer.getId(), paymentA.getId(), true));
            var attemptB = pool.submit(() -> payments.simulatePayment(buyer.getId(), paymentB.getId(), true));
            assertEquals(PaymentStatus.SUCCESS, attemptA.get().getStatus());
            assertEquals(PaymentStatus.SUCCESS, attemptB.get().getStatus());
            assertEquals(1, transactions.findAll().stream().filter(p -> p.getAccountId().equals(buyer.getId())
                    && p.getListingId().equals(approvedListing.getId()) && p.getPurpose() == PaymentPurpose.LISTING_UNLOCK
                    && p.getStatus() == PaymentStatus.SUCCESS).count());
            assertEquals(1, entitlements.findByAccountIdOrderByUnlockedAtDesc(buyer.getId()).stream()
                    .filter(unlock -> unlock.getListingId().equals(approvedListing.getId())).count());
        }
    }

    @Test
    void concurrentSellerFeeRetriesShareOneTransactionAndDoNotApprove() throws Exception {
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> payments.createListingFeePayment(seller.getId(), pendingListing.getId()));
            var second = pool.submit(() -> payments.createListingFeePayment(seller.getId(), pendingListing.getId()));
            var paymentA = first.get();
            var paymentB = second.get();
            assertEquals(paymentA.getId(), paymentB.getId());
            var attemptA = pool.submit(() -> payments.simulatePayment(seller.getId(), paymentA.getId(), true));
            var attemptB = pool.submit(() -> payments.simulatePayment(seller.getId(), paymentB.getId(), true));
            assertEquals(PaymentStatus.SUCCESS, attemptA.get().getStatus());
            assertEquals(PaymentStatus.SUCCESS, attemptB.get().getStatus());
            assertEquals(1, transactions.findAll().stream().filter(p -> p.getListingId().equals(pendingListing.getId())
                    && p.getPurpose() == PaymentPurpose.LISTING_FEE && p.getStatus() == PaymentStatus.SUCCESS).count());
            assertEquals(ListingStatus.PENDING_REVIEW, listings.findById(pendingListing.getId()).orElseThrow().getStatus());
        }
    }

    private Listing saveListing(String title, ListingStatus status, Long ownerId) {
        Listing listing = new Listing(title, "Private seller description", "truck", "Seller", "Pune",
                new BigDecimal("100.00"), "NEW", status, null, LocalDateTime.now());
        listing.setSellerUserId(ownerId);
        return listings.saveAndFlush(listing);
    }

    private void assertSamePayment(Long expected, Long actual) { assertEquals(expected, actual); }
}
