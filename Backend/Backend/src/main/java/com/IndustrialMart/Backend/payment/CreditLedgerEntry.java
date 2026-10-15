package com.IndustrialMart.Backend.payment;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "credit_ledger",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_credit_ledger_payment",
                columnNames = "payment_id"
        )
)
public class CreditLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    // Positive means credits added; negative means credits spent.
    @Column(nullable = false)
    private Integer creditChange;

    @Column(nullable = false, length = 40)
    private String reason;

    // A payment can grant credits only once.
    @Column(name = "payment_id", unique = true)
    private Long paymentId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected CreditLedgerEntry() {
    }

    public CreditLedgerEntry(
            Long accountId,
            Integer creditChange,
            String reason,
            Long paymentId) {
        this.accountId = accountId;
        this.creditChange = creditChange;
        this.reason = reason;
        this.paymentId = paymentId;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public Integer getCreditChange() {
        return creditChange;
    }

    public String getReason() {
        return reason;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}