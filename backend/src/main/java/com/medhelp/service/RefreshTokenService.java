package com.medhelp.service;

import com.medhelp.domain.entity.RefreshToken;
import com.medhelp.domain.entity.User;
import com.medhelp.config.MedHelpProperties;
import com.medhelp.dto.AuthDtos;
import com.medhelp.exception.ApiException;
import com.medhelp.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

/**
 * Issues, rotates and revokes refresh tokens.
 *
 * <p>Rotation on every refresh means a stolen refresh token can only be used
 * once before the legitimate client's next refresh invalidates it.
 */
@Service
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshTokenDays;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, MedHelpProperties properties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenDays = properties.getJwt().getRefreshTokenDays();
    }

    @Transactional
    public String issue(User user) {
        byte[] bytes = new byte[64];
        RANDOM.nextBytes(bytes);
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes));
        token.setExpiresAt(Instant.now().plus(refreshTokenDays, ChronoUnit.DAYS));
        refreshTokenRepository.save(token);
        return token.getToken();
    }

    /** Validates a refresh token and immediately consumes it (rotation). */
    @Transactional
    public User consume(String rawToken) {
        RefreshToken token = refreshTokenRepository.findByToken(rawToken)
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));

        if (!token.isUsable()) {
            throw ApiException.unauthorized("Refresh token has expired or been revoked");
        }

        token.setRevoked(true);
        refreshTokenRepository.save(token);
        return token.getUser();
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByToken(rawToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void revokeAllFor(Long userId) {
        refreshTokenRepository.revokeAllForUser(userId);
    }

    /** Builds the full auth response for a freshly authenticated user. */
    public AuthDtos.AuthResponse buildAuthResponse(User user, String accessToken, long accessTokenSeconds,
                                                  String refreshToken) {
        AuthDtos.UserSummary summary = new AuthDtos.UserSummary(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                true
        );
        return new AuthDtos.AuthResponse(accessToken, refreshToken, "Bearer", accessTokenSeconds, summary);
    }
}