package com.library.config.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record BorrowingConfigUpdateRequest(
        @Positive(message = "config.error.maxBooksPerUser.positive")
        int maxBooksPerUser,

        @Positive(message = "config.error.loanDurationDays.positive")
        int loanDurationDays,

        @Positive(message = "config.error.extendDurationDays.positive")
        int extendDurationDays,

        @PositiveOrZero(message = "config.error.maxExtensions.positiveOrZero")
        int maxExtensions,

        @Positive(message = "config.error.finePerDayIrt.positive")
        BigDecimal finePerDayIrt
) {
}
