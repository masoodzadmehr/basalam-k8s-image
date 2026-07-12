package com.library.reservation;

import com.library.reservation.Reservation.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Page<Reservation> findByUserId(Long userId, Pageable pageable);

    Page<Reservation> findByStatus(ReservationStatus status, Pageable pageable);

    Optional<Reservation> findByUserIdAndBookIdAndStatus(Long userId, Long bookId, ReservationStatus status);

    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, ReservationStatus status);

    @Query("SELECT r FROM Reservation r WHERE r.status = 'PENDING' AND r.expiryDate < :now")
    List<Reservation> findExpiredPending(LocalDateTime now);

    @Query("SELECT r FROM Reservation r WHERE r.status = 'FULFILLED' AND r.fulfilledDate < :cutoff")
    List<Reservation> findExpiredFulfilled(LocalDateTime cutoff);
}
