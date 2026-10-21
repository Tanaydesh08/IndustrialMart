package com.IndustrialMart.Backend.payment;

import com.IndustrialMart.Backend.user.User;
import com.IndustrialMart.Backend.user.UserRepository;
import com.IndustrialMart.Backend.user.UserRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/prototype")
public class PrototypePaymentController {

    private final PrototypePaymentService paymentService;
    private final UserRepository userRepository;

    public PrototypePaymentController(
            PrototypePaymentService paymentService,
            UserRepository userRepository) {
        this.paymentService = paymentService;
        this.userRepository = userRepository;
    }

    /** Legacy credit packs are disabled: buyers now pay per listing unlock. */
    @PostMapping("/payments/credits")
    public void createCreditPurchase(Authentication authentication) {
        User user = currentUser(authentication);
        requireRole(user, UserRole.BUYER);
        throw new ResponseStatusException(
                HttpStatus.GONE,
                "Credit packs are disabled. Use the listing-unlock payment endpoint.");
    }

    @PostMapping("/payments/listing-unlock")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentTransaction createListingUnlockPayment(
            Authentication authentication,
            @RequestParam Long listingId) {
        User user = currentUser(authentication);
        requireRole(user, UserRole.BUYER);
        return paymentService.createListingUnlockPayment(user.getId(), listingId);
    }

    /** Prototype-only simulation. A real gateway must verify payments server-side. */
    @PostMapping("/payments/{paymentId}/simulate")
    public PaymentTransaction simulatePayment(
            Authentication authentication,
            @PathVariable Long paymentId,
            @Valid @RequestBody SimulationRequest request) {
        User user = currentUser(authentication);
        return paymentService.simulatePayment(user.getId(), paymentId, request.success());
    }

    @GetMapping("/wallet")
    public PrototypePaymentService.WalletResponse getWallet(Authentication authentication) {
        User user = currentUser(authentication);
        requireRole(user, UserRole.BUYER);
        return paymentService.getWallet(user.getId());
    }

    @GetMapping("/wallet/ledger")
    public List<CreditLedgerEntry> getLedger(Authentication authentication) {
        User user = currentUser(authentication);
        requireRole(user, UserRole.BUYER);
        return paymentService.getLedger(user.getId());
    }

    @PostMapping("/payments/listing-fee")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentTransaction createListingFeePayment(
            Authentication authentication,
            @RequestParam Long listingId) {
        User user = currentUser(authentication);
        requireRole(user, UserRole.SELLER);
        return paymentService.createListingFeePayment(user.getId(), listingId);
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private void requireRole(User user, UserRole requiredRole) {
        if (user.getRole() != requiredRole) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This operation requires the " + requiredRole + " role");
        }
    }

    public record SimulationRequest(@NotNull Boolean success) {}
}
