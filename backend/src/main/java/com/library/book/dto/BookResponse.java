package com.library.book.dto;

import com.library.book.Book;

import java.util.UUID;

public record BookResponse(
        Long id,
        UUID uid,
        String title,
        String author,
        String isbn,
        String publisher,
        Integer publicationYear,
        int copiesCount,
        int availableCopies,
        Long shelfId
) {
    public static BookResponse from(Book book, int availableCopies) {
        return new BookResponse(
                book.getId(),
                book.getUid(),
                book.getTitle(),
                book.getAuthor(),
                book.getIsbn(),
                book.getPublisher(),
                book.getPublicationYear(),
                book.getCopiesCount(),
                availableCopies,
                book.getShelfId()
        );
    }
}
