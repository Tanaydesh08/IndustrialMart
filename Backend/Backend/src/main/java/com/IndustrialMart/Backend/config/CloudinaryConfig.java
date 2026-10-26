package com.IndustrialMart.Backend.config;

import com.cloudinary.Cloudinary;
import com.IndustrialMart.Backend.listing.CloudinaryAssetClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {
    @Bean
    Cloudinary cloudinary(@Value("${CLOUDINARY_CLOUD_NAME:}") String cloudName,
                          @Value("${CLOUDINARY_API_KEY:}") String apiKey,
                          @Value("${CLOUDINARY_API_SECRET:}") String apiSecret) {
        Map<String, String> config = new HashMap<>();
        if (!cloudName.isBlank()) config.put("cloud_name", cloudName);
        if (!apiKey.isBlank()) config.put("api_key", apiKey);
        if (!apiSecret.isBlank()) config.put("api_secret", apiSecret);
        config.put("secure", "true");
        return new Cloudinary(config);
    }

    @Bean
    CloudinaryAssetClient cloudinaryAssetClient(Cloudinary cloudinary,
            @Value("${CLOUDINARY_CLOUD_NAME:}") String cloudName,
            @Value("${CLOUDINARY_API_KEY:}") String apiKey,
            @Value("${CLOUDINARY_API_SECRET:}") String apiSecret) {
        return new CloudinaryAssetClientImpl(cloudinary,
                !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank());
    }
}
