package com.medhelp.dto;

import com.medhelp.domain.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request/response payloads for registration and login. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Full name is required")
            @Size(max = 150, message = "Full name is too long")
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
            String password,

            @Size(max = 20, message = "Phone number is too long")
            String phone,

            @NotNull(message = "Role is required")
            Role role,

            // Doctor-only optional fields, ignored for patients.
            String specialization,
            String hospital,
            String registrationNumber
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {
    }

    public record RefreshRequest(
            @NotBlank(message = "Refresh token is required")
            String refreshToken
    ) {
    }

    public record LogoutRequest(String refreshToken) {
    }

    /** Identity snapshot returned alongside the tokens. */
    public record UserSummary(
            Long id,
            String fullName,
            String email,
            Role role,
            boolean profileComplete
    ) {
    }

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long expiresInSeconds,
            UserSummary user
    ) {
    }
}