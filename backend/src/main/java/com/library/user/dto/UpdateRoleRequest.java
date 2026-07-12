package com.library.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateRoleRequest(
        @NotBlank(message = "user.error.role.required")
        String role
) {
}
