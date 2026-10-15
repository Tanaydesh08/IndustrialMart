
package com.IndustrialMart.Backend.payment;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface PaymentRepository
        extends JpaRepository<PaymentTransaction, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select p from PaymentTransaction p
        where p.id = :id
        """)
    Optional<PaymentTransaction> findByIdForUpdate(
            @Param("id") Long id
    );

    Optional<PaymentTransaction>
    findFirstByListingIdAndPurposeAndStatusInOrderByCreatedAtDesc(
            Long listingId,
            PaymentPurpose purpose,
            Collection<PaymentStatus> statuses
    );

    boolean existsByListingIdAndPurposeAndStatus(
            Long listingId,
            PaymentPurpose purpose,
            PaymentStatus status
    );
}
