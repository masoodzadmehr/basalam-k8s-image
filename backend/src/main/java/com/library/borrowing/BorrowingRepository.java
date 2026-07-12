package com.library.borrowing;

import com.library.borrowing.Borrowing.BorrowingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface BorrowingRepository extends JpaRepository<Borrowing, Long> {

    Page<Borrowing> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT COUNT(bw) FROM Borrowing bw WHERE bw.userId = :userId AND bw.status IN ('BORROWED', 'OVERDUE', 'EXTENDED')")
    int countActiveByUserId(Long userId);

    @Query("SELECT bw FROM Borrowing bw WHERE bw.status IN ('BORROWED', 'EXTENDED', 'OVERDUE')")
    Page<Borrowing> findActive(Pageable pageable);

    @Query("SELECT bw FROM Borrowing bw WHERE bw.status = 'OVERDUE' OR (bw.status IN ('BORROWED', 'EXTENDED') AND bw.dueDate < :now)")
    List<Borrowing> findOverdue(LocalDateTime now);

    long countByBookIdAndStatusIn(Long bookId, List<String> statuses);

    Page<Borrowing> findByStatus(BorrowingStatus status, Pageable pageable);
}
