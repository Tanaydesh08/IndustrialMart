
package com.IndustrialMart.Backend.payment;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CreditWalletRepository
        extends JpaRepository<CreditWallet, Long> {

    // Find a wallet using the accountId field in CreditWallet.java
    Optional<CreditWallet> findByAccountId(Long accountId);

    // Lock the wallet when updating its credit balance
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select w from CreditWallet w
        where w.accountId = :accountId
        """)
    Optional<CreditWallet> findByAccountIdForUpdate(
            @Param("accountId") Long accountId
    );
}
