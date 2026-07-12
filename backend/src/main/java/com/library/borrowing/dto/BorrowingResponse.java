package com.library.borrowing.dto;

import com.library.borrowing.Borrowing;

import java.time.LocalDateTime;
import java.util.UUID;

public record BorrowingResponse(
        Long id,
        UUID uid,
        Long userId,
        String username,
        Long bookId,
        String bookTitle,
        LocalDateTime borrowDate,
        LocalDateTime dueDate,
        LocalDateTime returnDate,
        String status,
        int extensionCount
) {
    public static BorrowingResponse from(Borrowing b, String username, String bookTitle) {
        return new BorrowingResponse(
                b.getId(),
                b.getUid(),
                b.getUserId(),
                username,
                b.getBookId(),
                bookTitle,
                b.getBorrowDate(),
                b.getDueDate(),
                b.getReturnDate(),
                b.getStatus().name(),
                b.getExtensionCount()
        );
    }
}
