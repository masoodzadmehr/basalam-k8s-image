package com.library.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = "auth.error.refreshToken.required")
        @JsonProperty("refresh_token")
        String refreshToken
) {
}
