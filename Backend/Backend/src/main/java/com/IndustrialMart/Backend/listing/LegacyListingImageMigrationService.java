package com.IndustrialMart.Backend.listing;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Service
public class LegacyListingImageMigrationService {
    private final ListingRepository listings;
    private final ListingImageStorage storage;
    private final Path legacyRoot;
    private final TransactionTemplate transactions;

    public LegacyListingImageMigrationService(ListingRepository listings, ListingImageStorage storage,
            PlatformTransactionManager transactionManager,
            @Value("${industrial-mart.storage.listing-images:./uploads/listings}") String legacyDirectory) {
        this.listings = listings;
        this.storage = storage;
        this.legacyRoot = Path.of(legacyDirectory).toAbsolutePath().normalize();
        this.transactions = new TransactionTemplate(transactionManager);
    }

    public MigrationResult migrate() {
        List<String> uploaded = new ArrayList<>();
        try {
            return transactions.execute(status -> migrateWithinTransaction(uploaded));
        } catch (RuntimeException failure) {
            storage.deleteUploaded(uploaded);
            throw failure;
        }
    }

    private MigrationResult migrateWithinTransaction(List<String> uploaded) {
        int migrated = 0;
        int missing = 0;
        for (Listing listing : listings.findAll()) {
            List<String> updated = new ArrayList<>(listing.getImageUrls());
            boolean changed = false;
            for (int index = 0; index < updated.size(); index++) {
                String url = updated.get(index);
                if (url == null || !url.startsWith("/listing-images/")) continue;
                String filename = url.substring("/listing-images/".length());
                Path file = legacyRoot.resolve(filename).normalize();
                if (!file.startsWith(legacyRoot) || !Files.isRegularFile(file)) { missing++; continue; }
                String newUrl = storage.migrateLegacyFile(filename);
                uploaded.add(newUrl);
                updated.set(index, newUrl);
                migrated++;
                changed = true;
            }
            if (changed) {
                listing.setImageUrls(updated);
                listings.save(listing);
            }
        }
        return new MigrationResult(migrated, missing);
    }

    public record MigrationResult(int migratedImages, int missingLegacyFiles) {}
}
