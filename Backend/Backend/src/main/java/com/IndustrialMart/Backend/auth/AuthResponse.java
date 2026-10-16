
package com.IndustrialMart.Backend.auth;

import com.IndustrialMart.Backend.user.UserRole;

public record AuthResponse(
        Long userId,
        String fullName,
        String email,
        UserRole role,
        String token,
        String tokenType
) {
}
