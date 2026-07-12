package com.library.reservation.dto;

import jakarta.validation.constraints.NotNull;

public record ReservationRequest(
        @NotNull
        Long bookId
) {
}
