package com.library.location;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ShelfRepository extends JpaRepository<Shelf, Long> {

    List<Shelf> findByBookshelfId(Long bookshelfId);

    List<Shelf> findByLibrarianUserId(Long librarianUserId);

    @Query("SELECT COUNT(s) > 0 FROM Shelf s JOIN Book b ON b.shelfId = s.id WHERE s.id = :shelfId")
    boolean hasBooks(Long shelfId);

    @Query("SELECT COUNT(s) > 0 FROM Shelf s JOIN Book b ON b.shelfId = s.id WHERE s.bookshelfId = :bookshelfId")
    boolean hasBooksByBookshelfId(Long bookshelfId);

    @Query("SELECT COUNT(s) > 0 FROM Shelf s JOIN Book b ON b.shelfId = s.id WHERE s.bookshelfId IN (SELECT bs.id FROM Bookshelf bs WHERE bs.hallId = :hallId)")
    boolean hasBooksByHallId(Long hallId);
}
