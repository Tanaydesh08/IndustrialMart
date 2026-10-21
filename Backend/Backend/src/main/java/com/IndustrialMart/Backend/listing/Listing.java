
package com.IndustrialMart.Backend.listing;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "listings")
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(nullable = false, length = 5000)
    private String description;

    @NotBlank
    @Column(nullable = false)
    private String categorySlug;

    @NotBlank
    @Column(nullable = false)
    private String sellerName;

    @Column(name = "seller_user_id")
    private Long sellerUserId;

    @NotBlank
    @Column(nullable = false)
    private String location;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @NotBlank
    @Column(nullable = false)
    private String condition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus status;

    @Column(length = 1000)
    private String moderationReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "listing_images", joinColumns = @JoinColumn(name = "listing_id"))
    @Column(name = "image_url", nullable = false, length = 500)
    private List<String> imageUrls = new ArrayList<>();

    protected Listing() {
        // Required by JPA
    }

    public Listing(
            String title,
            String description,
            String categorySlug,
            String sellerName,
            String location,
            BigDecimal price,
            String condition,
            ListingStatus status,
            String moderationReason,
            LocalDateTime createdAt
    ) {
        this.title = title;
        this.description = description;
        this.categorySlug = categorySlug;
        this.sellerName = sellerName;
        this.location = location;
        this.price = price;
        this.condition = condition;
        this.status = status;
        this.moderationReason = moderationReason;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ListingStatus.PENDING_REVIEW;
        }
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategorySlug() { return categorySlug; }
    public String getSellerName() { return sellerName; }
    public String getLocation() { return location; }
    public BigDecimal getPrice() { return price; }
    public String getCondition() { return condition; }
    public ListingStatus getStatus() { return status; }
    public String getModerationReason() { return moderationReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<String> getImageUrls() { return imageUrls; }

    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setCategorySlug(String categorySlug) { this.categorySlug = categorySlug; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }
    public void setLocation(String location) { this.location = location; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setCondition(String condition) { this.condition = condition; }
    public void setStatus(ListingStatus status) { this.status = status; }
    public void setModerationReason(String moderationReason) {
        this.moderationReason = moderationReason;
    }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls == null ? new ArrayList<>() : new ArrayList<>(imageUrls); }
    public Long getSellerUserId() {
        return sellerUserId;
    }

    public void setSellerUserId(Long sellerUserId) {
        this.sellerUserId = sellerUserId;
    }
}
