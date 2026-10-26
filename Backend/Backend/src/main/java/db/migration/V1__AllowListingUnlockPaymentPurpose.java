package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;

/**
 * Extends the existing purpose check without rewriting or deleting payment rows.
 * On an empty database this is a no-op; Hibernate creates the same check from the entity mapping.
 */
public class V1__AllowListingUnlockPaymentPurpose extends BaseJavaMigration {
    private static final String TABLE = "payment_transactions";

    @Override
    public void migrate(Context context) throws Exception {
        Connection connection = context.getConnection();
        if (!tableExists(connection)) return;

        try (Statement statement = connection.createStatement()) {
            statement.execute("ALTER TABLE payment_transactions " +
                    "DROP CONSTRAINT IF EXISTS payment_transactions_purpose_check");
            statement.execute("ALTER TABLE payment_transactions " +
                    "ADD CONSTRAINT payment_transactions_purpose_check " +
                    "CHECK (purpose IN ('CREDIT_PACK', 'LISTING_FEE', 'LISTING_UNLOCK'))");
        }
    }

    private boolean tableExists(Connection connection) throws Exception {
        DatabaseMetaData metadata = connection.getMetaData();
        String catalog = connection.getCatalog();
        String schema = connection.getSchema();
        for (String name : List.of(TABLE, TABLE.toUpperCase(java.util.Locale.ROOT))) {
            try (ResultSet tables = metadata.getTables(catalog, schema, name, new String[] { "TABLE" })) {
                if (tables.next()) return true;
            }
        }
        return false;
    }
}
