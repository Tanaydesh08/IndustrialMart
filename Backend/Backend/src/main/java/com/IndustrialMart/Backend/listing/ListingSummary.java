package com.IndustrialMart.Backend.listing;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ListingSummary(Long id, String title, String categorySlug, BigDecimal price,
                             String condition, ListingStatus status, LocalDateTime createdAt,
                             List<String> imageUrls) {
    public static ListingSummary from(Listing listing) {
        return new ListingSummary(listing.getId(), listing.getTitle(), listing.getCategorySlug(),
                listing.getPrice(), listing.getCondition(), listing.getStatus(), listing.getCreatedAt(),
                listing.getImageUrls());
    }
}
