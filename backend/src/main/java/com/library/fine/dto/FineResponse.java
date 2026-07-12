package com.library.fine.dto;

import com.library.fine.Fine;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record FineResponse(
        Long id,
        UUID uid,
        Long borrowingId,
        Long userId,
        String username,
        String bookTitle,
        BigDecimal amount,
        BigDecimal dailyRate,
        int daysOverdue,
        boolean paid,
        LocalDateTime paidDate,
        LocalDateTime createdDate
) {
    public static FineResponse from(Fine f, String username, String bookTitle) {
        return new FineResponse(
                f.getId(),
                f.getUid(),
                f.getBorrowingId(),
                f.getUserId(),
                username,
                bookTitle,
                f.getAmount(),
                f.getDailyRate(),
                f.getDaysOverdue(),
                f.isPaid(),
                f.getPaidDate(),
                f.getCreatedDate()
        );
    }
}
