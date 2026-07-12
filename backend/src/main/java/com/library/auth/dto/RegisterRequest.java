package com.library.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "auth.error.username.required")
        @Size(min = 3, max = 50, message = "auth.error.username.size")
        String username,

        @NotBlank(message = "auth.error.password.required")
        @Size(min = 6, max = 100, message = "auth.error.password.size")
        String password,

        @NotBlank(message = "auth.error.email.required")
        @Email(message = "auth.error.email.invalid")
        String email,

        @NotBlank(message = "auth.error.firstName.required")
        @Size(max = 100, message = "auth.error.firstName.size")
        String firstName,

        @NotBlank(message = "auth.error.lastName.required")
        @Size(max = 100, message = "auth.error.lastName.size")
        String lastName,

        @Size(max = 20, message = "auth.error.mobile.size")
        String mobile
) {
}
