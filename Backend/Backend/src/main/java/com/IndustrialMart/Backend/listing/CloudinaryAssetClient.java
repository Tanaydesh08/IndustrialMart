package com.IndustrialMart.Backend.listing;

public interface CloudinaryAssetClient {
    void upload(byte[] bytes, String publicId);
    byte[] download(String publicId, String format);
    void delete(String publicId);
}
