package com.library.book.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record BookRequest(
        @NotBlank(message = "book.error.title.required")
        @Size(max = 255, message = "book.error.title.size")
        String title,

        @NotBlank(message = "book.error.author.required")
        @Size(max = 255, message = "book.error.author.size")
        String author,

        @NotBlank(message = "book.error.isbn.required")
        @Size(max = 20, message = "book.error.isbn.size")
        String isbn,

        @Size(max = 255, message = "book.error.publisher.size")
        String publisher,

        Integer publicationYear,

        @Positive(message = "book.error.copiesCount.positive")
        int copiesCount,

        @NotNull(message = "book.error.shelfId.required")
        Long shelfId
) {
}
