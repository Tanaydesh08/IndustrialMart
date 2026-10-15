package com.IndustrialMart.Backend.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreditLedgerRepository
        extends JpaRepository<CreditLedgerEntry, Long> {

    boolean existsByPaymentId(Long paymentId);

    List<CreditLedgerEntry> findByAccountIdOrderByCreatedAtDesc(
            Long accountId
    );
}