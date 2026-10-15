package com.IndustrialMart.Backend.unlock;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ListingUnlockRepository extends JpaRepository<ListingUnlock, Long> {
    Optional<ListingUnlock> findByAccountIdAndListingId(
            Long accountId,
            Long listingId
    );

    boolean existsByAccountIdAndListingId(
            Long accountId,
            Long listingId
    );

    List<ListingUnlock> findByAccountIdOrderByUnlockedAtDesc(Long accountId);
}
