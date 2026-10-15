package com.IndustrialMart.Backend.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prototype")
public class PrototypePaymentController {

    private final PrototypePaymentService paymentService;

    public PrototypePaymentController(
            PrototypePaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/payments/credits")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentTransaction createCreditPurchase(
            @RequestParam Long accountId) {
        return paymentService.createCreditPurchase(accountId);
    }

    @PostMapping("/payments/{paymentId}/simulate")
    public PaymentTransaction simulatePayment(
            @RequestParam Long accountId,
            @PathVariable Long paymentId,
            @Valid @RequestBody SimulationRequest request) {
        return paymentService.simulatePayment(
                accountId,
                paymentId,
                request.success()
        );
    }

    @GetMapping("/wallet")
    public PrototypePaymentService.WalletResponse getWallet(
            @RequestParam Long accountId) {
        return paymentService.getWallet(accountId);
    }

    @GetMapping("/wallet/ledger")
    public List<CreditLedgerEntry> getLedger(
            @RequestParam Long accountId) {
        return paymentService.getLedger(accountId);
    }

    public record SimulationRequest(
            @NotNull Boolean success
    ) {}

    @PostMapping("/payments/listing-fee")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentTransaction createListingFeePayment(
            @RequestParam Long accountId,
            @RequestParam Long listingId) {

        return paymentService.createListingFeePayment(
                accountId,
                listingId
        );
    }
}