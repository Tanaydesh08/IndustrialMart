package com.IndustrialMart.Backend.listing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "listing_photo_assets")
public class ListingPhotoBlob {
    @Id
    @Column(name = "object_key", nullable = false, length = 40)
    private String objectKey;

    @Column(name = "cloudinary_public_id", nullable = false, unique = true, length = 255)
    private String cloudinaryPublicId;

    @Column(name = "content_type", nullable = false, length = 30)
    private String contentType;

    @Column(name = "format", nullable = false, length = 10)
    private String format;

    protected ListingPhotoBlob() {}

    public ListingPhotoBlob(String objectKey, String cloudinaryPublicId, String contentType, String format) {
        this.objectKey = objectKey;
        this.cloudinaryPublicId = cloudinaryPublicId;
        this.contentType = contentType;
        this.format = format;
    }

    public String getObjectKey() { return objectKey; }
    public String getContentType() { return contentType; }
    public String getCloudinaryPublicId() { return cloudinaryPublicId; }
    public String getFormat() { return format; }
}
