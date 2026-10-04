package com.medhelp.config;

import com.medhelp.storage.LocalStorageService;
import com.medhelp.storage.StorageService;
import com.medhelp.storage.SupabaseStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Chooses the file storage implementation.
 *
 * <p>Everything else in the application depends on {@link StorageService}, so
 * moving from local disk to Supabase Storage is a matter of setting
 * {@code STORAGE_PROVIDER=supabase} plus the Supabase credentials.
 */
@Configuration
public class StorageConfig {

    private static final Logger log = LoggerFactory.getLogger(StorageConfig.class);

    @Bean
    public StorageService storageService(MedHelpProperties properties) {
        String provider = properties.getStorage().getProvider() == null
                ? "local"
                : properties.getStorage().getProvider().trim().toLowerCase();

        if ("supabase".equals(provider)) {
            log.info("Using Supabase Storage for medical documents");
            return new SupabaseStorageService(properties);
        }

        log.info("Using local filesystem storage for medical documents");
        return new LocalStorageService(properties);
    }
}