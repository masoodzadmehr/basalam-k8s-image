package com.library.borrowing.dto;

import jakarta.validation.constraints.NotNull;

public record BorrowRequest(
        Long userId,

        @NotNull
        Long bookId
) {
}
