package com.library.location.dto;

import jakarta.validation.constraints.NotNull;

public record AssignLibrarianRequest(
        @NotNull(message = "Librarian user ID is required")
        Long librarianUserId
) {
}
