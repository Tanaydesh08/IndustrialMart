
package com.IndustrialMart.Backend.listing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Collection;
import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from Listing l where l.id = :id")
    java.util.Optional<Listing> findByIdForUpdate(@Param("id") Long id);

    List<Listing> findByStatus(ListingStatus status);

    List<Listing> findByStatusIn(
            Collection<ListingStatus> statuses
    );

    List<Listing> findTop12ByStatusOrderByCreatedAtDesc(ListingStatus status);
    long countByStatus(ListingStatus status);
    List<Listing> findBySellerUserIdOrderByCreatedAtDesc(Long sellerUserId);
    List<Listing> findByImageUrlsContaining(String imageUrl);
}
