package com.IndustrialMart.Backend.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of(
                "application", "Industrial Mart API",
                "status", "UP",
                "TimeStamp", LocalDateTime.now()
        );
    }
}