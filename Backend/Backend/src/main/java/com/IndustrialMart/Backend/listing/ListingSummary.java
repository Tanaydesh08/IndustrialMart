package com.IndustrialMart.Backend.listing;

import java.util.List;

public record ListingSummary(Long id, String title, List<String> imageUrls) {
    public static ListingSummary from(Listing listing) {
        return new ListingSummary(listing.getId(), listing.getTitle(),
                listing.getImageUrls().stream().limit(1).toList());
    }
}
