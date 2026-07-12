package com.library.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import java.time.LocalDateTime;
import java.util.Map;

@JsonInclude(Include.NON_NULL)
public record ErrorResponse(
        int status,
        String error,
        String message,
        LocalDateTime timestamp,
        String path,
        Map<String, String> errors
) {

    public ErrorResponse(int status, String error, String message, String path) {
        this(status, error, message, LocalDateTime.now(), path, null);
    }

    public ErrorResponse(int status, String error, String message, String path, Map<String, String> errors) {
        this(status, error, message, LocalDateTime.now(), path, errors);
    }
}
