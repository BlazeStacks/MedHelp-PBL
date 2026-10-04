package com.medhelp.storage;

import com.medhelp.config.MedHelpProperties;
import com.medhelp.exception.ApiException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/** Stores uploaded documents on the local filesystem for development/demo runs. */
public class LocalStorageService implements StorageService {

    private final Path root;

    public LocalStorageService(MedHelpProperties properties) {
        this.root = Path.of(properties.getStorage().getLocalPath()).toAbsolutePath().normalize();
    }

    @Override
    public void store(String path, byte[] content, String contentType) {
        Path target = resolve(path);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, content);
        } catch (IOException e) {
            throw ApiException.badRequest("Could not store uploaded document");
        }
    }

    @Override
    public byte[] read(String path) {
        try {
            return Files.readAllBytes(resolve(path));
        } catch (IOException e) {
            throw ApiException.notFound("Document file not found");
        }
    }

    @Override
    public void delete(String path) {
        try {
            Files.deleteIfExists(resolve(path));
        } catch (IOException e) {
            throw ApiException.badRequest("Could not delete document file");
        }
    }

    @Override
    public String providerName() {
        return "local";
    }

    private Path resolve(String path) {
        Path resolved = root.resolve(path).normalize();
        if (!resolved.startsWith(root)) {
            throw ApiException.badRequest("Invalid document storage path");
        }
        return resolved;
    }
}
