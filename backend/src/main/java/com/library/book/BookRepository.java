package com.library.book;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

    @Query("SELECT b FROM Book b WHERE (:title IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND (:author IS NULL OR LOWER(b.author) LIKE LOWER(CONCAT('%', :author, '%'))) AND (:isbn IS NULL OR b.isbn = :isbn)")
    Page<Book> search(String title, String author, String isbn, Pageable pageable);

    boolean existsByIsbn(String isbn);

    Optional<Book> findByIsbn(String isbn);

    boolean existsByShelfId(Long shelfId);

    @Query("SELECT COUNT(bw) FROM Borrowing bw WHERE bw.bookId = :bookId AND bw.status IN ('BORROWED', 'OVERDUE', 'EXTENDED')")
    long countActiveBorrowings(Long bookId);
}
