
package com.IndustrialMart.Backend.listing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    List<Listing> findByStatus(ListingStatus status);

    List<Listing> findByStatusIn(
            Collection<ListingStatus> statuses
    );
}
