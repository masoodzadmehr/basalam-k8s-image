package com.library.location.dto;

import com.library.location.Bookshelf;
import com.library.location.Hall;
import com.library.location.Shelf;

import java.util.UUID;

public record LocationResponse(
        Long id,
        UUID uid,
        String name,
        String description,
        Long parentId,
        String type,
        Long librarianUserId
) {
    public static LocationResponse fromHall(Hall hall) {
        return new LocationResponse(
                hall.getId(),
                hall.getUid(),
                hall.getName(),
                hall.getDescription(),
                null,
                "HALL",
                hall.getLibrarianUserId()
        );
    }

    public static LocationResponse fromBookshelf(Bookshelf bookshelf) {
        return new LocationResponse(
                bookshelf.getId(),
                bookshelf.getUid(),
                bookshelf.getName(),
                null,
                bookshelf.getHallId(),
                "BOOKSHELF",
                bookshelf.getLibrarianUserId()
        );
    }

    public static LocationResponse fromShelf(Shelf shelf) {
        return new LocationResponse(
                shelf.getId(),
                shelf.getUid(),
                shelf.getName(),
                null,
                shelf.getBookshelfId(),
                "SHELF",
                shelf.getLibrarianUserId()
        );
    }
}
