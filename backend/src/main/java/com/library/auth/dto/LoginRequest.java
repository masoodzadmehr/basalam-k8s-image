package com.library.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "auth.error.username.required")
        String username,

        @NotBlank(message = "auth.error.password.required")
        String password
) {
}
