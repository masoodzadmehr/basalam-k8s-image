package com.library.fine;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FineRepository extends JpaRepository<Fine, Long> {

    Page<Fine> findByUserId(Long userId, Pageable pageable);

    Page<Fine> findByPaidFalse(Pageable pageable);

    Optional<Fine> findByBorrowingId(Long borrowingId);
}
