package com.library.reservation.dto;

import com.library.reservation.Reservation;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReservationResponse(
        Long id,
        UUID uid,
        Long userId,
        String username,
        Long bookId,
        String bookTitle,
        LocalDateTime reserveDate,
        LocalDateTime expiryDate,
        LocalDateTime fulfilledDate,
        String status
) {
    public static ReservationResponse from(Reservation r, String username, String bookTitle) {
        return new ReservationResponse(
                r.getId(),
                r.getUid(),
                r.getUserId(),
                username,
                r.getBookId(),
                bookTitle,
                r.getReserveDate(),
                r.getExpiryDate(),
                r.getFulfilledDate(),
                r.getStatus().name()
        );
    }
}
