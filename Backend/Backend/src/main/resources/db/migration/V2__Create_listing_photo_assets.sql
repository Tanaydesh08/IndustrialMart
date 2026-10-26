CREATE TABLE listing_photo_assets (
    object_key VARCHAR(40) PRIMARY KEY,
    cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
    content_type VARCHAR(30) NOT NULL,
    format VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
