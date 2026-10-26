package com.IndustrialMart.Backend.listing;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/storage")
public class LegacyListingImageMigrationController {
    private final LegacyListingImageMigrationService migration;

    public LegacyListingImageMigrationController(LegacyListingImageMigrationService migration) {
        this.migration = migration;
    }

    @PostMapping("/migrate-legacy-listing-images")
    public LegacyListingImageMigrationService.MigrationResult migrate() {
        return migration.migrate();
    }
}
