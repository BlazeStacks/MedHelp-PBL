package com.medhelp.storage;

import com.medhelp.config.MedHelpProperties;
import com.medhelp.exception.ApiException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

/** Stores uploaded documents in a private Supabase Storage bucket. */
public class SupabaseStorageService implements StorageService {

    private final RestClient restClient;
    private final String bucket;

    public SupabaseStorageService(MedHelpProperties properties) {
        MedHelpProperties.Storage storage = properties.getStorage();
        if (isBlank(storage.getSupabaseUrl()) || isBlank(storage.getSupabaseServiceKey())) {
            throw ApiException.badRequest("Supabase storage is enabled but credentials are missing");
        }

        this.bucket = storage.getSupabaseBucket();
        this.restClient = RestClient.builder()
                .baseUrl(storage.getSupabaseUrl().replaceAll("/+$", "") + "/storage/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + storage.getSupabaseServiceKey())
                .defaultHeader("apikey", storage.getSupabaseServiceKey())
                .build();
    }

    @Override
    public void store(String path, byte[] content, String contentType) {
        try {
            restClient.post()
                    .uri("/object/{bucket}/{path}", bucket, path)
                    .header("x-upsert", "true")
                    .contentType(contentType == null
                            ? MediaType.APPLICATION_OCTET_STREAM
                            : MediaType.parseMediaType(contentType))
                    .body(content)
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpStatusCodeException e) {
            throw ApiException.badRequest("Could not store document in Supabase");
        }
    }

    @Override
    public byte[] read(String path) {
        try {
            return restClient.get()
                    .uri("/object/{bucket}/{path}", bucket, path)
                    .retrieve()
                    .body(byte[].class);
        } catch (HttpStatusCodeException e) {
            throw ApiException.notFound("Document file not found");
        }
    }

    @Override
    public void delete(String path) {
        try {
            restClient.delete()
                    .uri("/object/{bucket}/{path}", bucket, path)
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpStatusCodeException e) {
            throw ApiException.badRequest("Could not delete document from Supabase");
        }
    }

    @Override
    public String providerName() {
        return "supabase";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
