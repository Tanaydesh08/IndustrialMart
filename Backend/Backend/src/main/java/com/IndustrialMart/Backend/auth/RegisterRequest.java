
package com.IndustrialMart.Backend.auth;

import com.IndustrialMart.Backend.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "Full name is required")
        @Size(max = 120, message = "Full name cannot exceed 120 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 254, message = "Email cannot exceed 254 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72,
                message = "Password must be between 8 and 72 characters")
        String password,

        @NotBlank(message = "Role is required")
        @Pattern(
                regexp = "(?i)BUYER|SELLER",
                message = "Role must be BUYER or SELLER"
        )
        String role
) {
    public UserRole toUserRole() {
        return UserRole.valueOf(role.toUpperCase());
    }
}
