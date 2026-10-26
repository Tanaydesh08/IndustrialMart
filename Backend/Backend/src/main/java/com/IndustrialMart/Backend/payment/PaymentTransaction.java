package com.IndustrialMart.Backend.payment;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long accountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30,
            columnDefinition = "varchar(30) check (purpose IN ('CREDIT_PACK', 'LISTING_FEE', 'LISTING_UNLOCK'))")
    private PaymentPurpose purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(nullable = false)
    private Long amountPaise;

    @Column(nullable = false)
    private Integer creditsToGrant;

    @Column(name = "listing_id")
    private Long listingId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    protected PaymentTransaction() {
    }

    public PaymentTransaction(
            Long accountId,
            PaymentPurpose purpose,
            Long amountPaise,
            Integer creditsToGrant) {
        this.accountId = accountId;
        this.purpose = purpose;
        this.amountPaise = amountPaise;
        this.creditsToGrant = creditsToGrant;
        this.status = PaymentStatus.PENDING;
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

    public PaymentPurpose getPurpose() {
        return purpose;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public Long getAmountPaise() {
        return amountPaise;
    }

    public Integer getCreditsToGrant() {
        return creditsToGrant;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Long getListingId() {
        return listingId;
    }

    public void setListingId(Long listingId) {
        this.listingId = listingId;
    }
}
