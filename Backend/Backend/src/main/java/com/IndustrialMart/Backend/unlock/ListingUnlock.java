package com.IndustrialMart.Backend.unlock;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "listing_unlocks",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_listing_unlock_account_listing",
                columnNames = {"account_id", "listing_id"}
        )
)
public class ListingUnlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime unlockedAt;

    protected ListingUnlock() {
    }

    public ListingUnlock(Long accountId, Long listingId) {
        this.accountId = accountId;
        this.listingId = listingId;
        this.unlockedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public Long getListingId() {
        return listingId;
    }

    public LocalDateTime getUnlockedAt() {
        return unlockedAt;
    }
}