package com.IndustrialMart.Backend;

import db.migration.V1__AllowListingUnlockPaymentPurpose;
import org.flywaydb.core.api.migration.Context;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PaymentPurposeMigrationTests {
    @Test
    void migrationKeepsExistingRowsAndAllowsEverySupportedPaymentPurpose() throws Exception {
        String url = "jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=PostgreSQL";
        try (Connection connection = DriverManager.getConnection(url, "sa", "")) {
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE TABLE payment_transactions (id BIGINT PRIMARY KEY, purpose VARCHAR(30) NOT NULL, " +
                        "CONSTRAINT payment_transactions_purpose_check CHECK (purpose IN ('CREDIT_PACK', 'LISTING_FEE'))) ");
                statement.execute("INSERT INTO payment_transactions VALUES (1, 'CREDIT_PACK'), (2, 'LISTING_FEE')");
            }

            Context context = mock(Context.class);
            when(context.getConnection()).thenReturn(connection);
            new V1__AllowListingUnlockPaymentPurpose().migrate(context);

            try (Statement statement = connection.createStatement()) {
                assertEquals(2, countRows(statement));
                statement.execute("INSERT INTO payment_transactions VALUES (3, 'LISTING_UNLOCK')");
                assertEquals(3, countRows(statement));
                assertThrows(SQLException.class,
                        () -> statement.execute("INSERT INTO payment_transactions VALUES (4, 'UNSUPPORTED')"));
            }
        }
    }

    @Test
    void migrationIsSafeBeforeHibernateCreatesTablesOnAnEmptyDatabase() throws Exception {
        String url = "jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=PostgreSQL";
        try (Connection connection = DriverManager.getConnection(url, "sa", "")) {
            Context context = mock(Context.class);
            when(context.getConnection()).thenReturn(connection);
            assertDoesNotThrow(() -> new V1__AllowListingUnlockPaymentPurpose().migrate(context));
        }
    }

    private long countRows(Statement statement) throws SQLException {
        try (var result = statement.executeQuery("SELECT COUNT(*) FROM payment_transactions")) {
            result.next();
            return result.getLong(1);
        }
    }
}
