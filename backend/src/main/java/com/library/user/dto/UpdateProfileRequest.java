package com.library.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 100, message = "user.error.firstName.size")
        String firstName,

        @Size(max = 100, message = "user.error.lastName.size")
        String lastName,

        @Size(max = 20, message = "user.error.mobile.size")
        String mobile
) {
}
