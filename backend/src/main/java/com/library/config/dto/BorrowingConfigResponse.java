package com.library.config.dto;

import com.library.borrowing.BorrowingConfig;

import java.math.BigDecimal;

public record BorrowingConfigResponse(
        int maxBooksPerUser,
        int loanDurationDays,
        int extendDurationDays,
        int maxExtensions,
        BigDecimal finePerDayIrt
) {
    public static BorrowingConfigResponse from(BorrowingConfig c) {
        return new BorrowingConfigResponse(
                c.getMaxBooksPerUser(),
                c.getLoanDurationDays(),
                c.getExtendDurationDays(),
                c.getMaxExtensions(),
                c.getFinePerDayIrt()
        );
    }
}
