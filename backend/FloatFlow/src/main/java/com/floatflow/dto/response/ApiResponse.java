package com.floatflow.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Standard wrapper for all API responses.
 * Gives the frontend a consistent structure to parse.
 *
 * Example success: { "success": true, "message": "Float created", "data": {...} }
 * Example error:   { "success": false, "message": "Insufficient float balance", "data": null }
 */
@Data
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .data(null)
            .build();
    }
}
