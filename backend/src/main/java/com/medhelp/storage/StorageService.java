package com.medhelp.storage;

/**
 * Stores document bytes outside PostgreSQL.
 *
 * <p>Implementations keep the same path contract so the database only needs to
 * remember one storage reference regardless of the backing provider.
 */
public interface StorageService {

    void store(String path, byte[] content, String contentType);

    byte[] read(String path);

    void delete(String path);

    String providerName();
}
