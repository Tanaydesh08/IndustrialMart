package com.IndustrialMart.Backend.payment;

import jakarta.persistence.*;

@Entity
@Table(
        name = "credit_wallets",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_wallet_account",
                columnNames = "account_id"
        )
)
public class CreditWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(nullable = false)
    private Integer balance = 0;

    @Version
    private Long version;

    protected CreditWallet() {
    }

    public CreditWallet(Long accountId) {
        this.accountId = accountId;
        this.balance = 0;
    }

    public Long getId() {
        return id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public Integer getBalance() {
        return balance;
    }

    public void addCredits(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException(
                    "Credits to add must be positive"
            );
        }
        balance = Math.addExact(balance, amount);
    }

    public void spendCredits(int amount) {
        if (amount <= 0 || balance < amount) {
            throw new IllegalStateException(
                    "Insufficient credits"
            );
        }
        balance -= amount;
    }
}