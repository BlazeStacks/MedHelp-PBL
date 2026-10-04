package com.medhelp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Typed binding for the {@code medhelp.*} configuration tree.
 *
 * <p>Keeping this in one place means secrets are only ever read from the
 * environment, never hardcoded, and every consumer injects the same object.
 */
@Component
@ConfigurationProperties(prefix = "medhelp")
public class MedHelpProperties {

    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private Storage storage = new Storage();
    private boolean seedDemoData = false;

    public Jwt getJwt() {
        return jwt;
    }

    public void setJwt(Jwt jwt) {
        this.jwt = jwt;
    }

    public Cors getCors() {
        return cors;
    }

    public void setCors(Cors cors) {
        this.cors = cors;
    }

    public Storage getStorage() {
        return storage;
    }

    public void setStorage(Storage storage) {
        this.storage = storage;
    }

    public boolean isSeedDemoData() {
        return seedDemoData;
    }

    public void setSeedDemoData(boolean seedDemoData) {
        this.seedDemoData = seedDemoData;
    }

    public static class Jwt {
        private String secret = "";
        private long accessTokenMinutes = 60;
        private long refreshTokenDays = 14;

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public long getAccessTokenMinutes() {
            return accessTokenMinutes;
        }

        public void setAccessTokenMinutes(long accessTokenMinutes) {
            this.accessTokenMinutes = accessTokenMinutes;
        }

        public long getRefreshTokenDays() {
            return refreshTokenDays;
        }

        public void setRefreshTokenDays(long refreshTokenDays) {
            this.refreshTokenDays = refreshTokenDays;
        }
    }

    public static class Cors {
        /** Comma-separated list of allowed frontend origins. */
        private String allowedOrigins = "http://localhost:5173";

        public String getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(String allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }

    public static class Storage {
        /** {@code local} or {@code supabase}. */
        private String provider = "local";
        private String localPath = "./storage";
        private String supabaseUrl = "";
        private String supabaseServiceKey = "";
        private String supabaseBucket = "medical-documents";
        private long signedUrlSeconds = 300;

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        public String getLocalPath() {
            return localPath;
        }

        public void setLocalPath(String localPath) {
            this.localPath = localPath;
        }

        public String getSupabaseUrl() {
            return supabaseUrl;
        }

        public void setSupabaseUrl(String supabaseUrl) {
            this.supabaseUrl = supabaseUrl;
        }

        public String getSupabaseServiceKey() {
            return supabaseServiceKey;
        }

        public void setSupabaseServiceKey(String supabaseServiceKey) {
            this.supabaseServiceKey = supabaseServiceKey;
        }

        public String getSupabaseBucket() {
            return supabaseBucket;
        }

        public void setSupabaseBucket(String supabaseBucket) {
            this.supabaseBucket = supabaseBucket;
        }

        public long getSignedUrlSeconds() {
            return signedUrlSeconds;
        }

        public void setSignedUrlSeconds(long signedUrlSeconds) {
            this.signedUrlSeconds = signedUrlSeconds;
        }
    }
}