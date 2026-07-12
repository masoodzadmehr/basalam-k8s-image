package com.library.reservation;

import com.library.book.Book;
import com.library.book.BookRepository;
import com.library.borrowing.BorrowingConfigRepository;
import com.library.common.exception.BusinessException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.reservation.Reservation.ReservationStatus;
import com.library.reservation.dto.ReservationRequest;
import com.library.reservation.dto.ReservationResponse;
import com.library.user.User;
import com.library.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BorrowingConfigRepository borrowingConfigRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              BookRepository bookRepository,
                              UserRepository userRepository,
                              BorrowingConfigRepository borrowingConfigRepository) {
        this.reservationRepository = reservationRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.borrowingConfigRepository = borrowingConfigRepository;
    }

    public ReservationResponse reserve(ReservationRequest request, String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", currentUsername));

        Book book = bookRepository.findById(request.bookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book", request.bookId()));

        long activeBorrowings = bookRepository.countActiveBorrowings(request.bookId());
        if (book.getCopiesCount() - activeBorrowings > 0) {
            throw new BusinessException("Book is available; borrow it instead");
        }

        if (reservationRepository.existsByUserIdAndBookIdAndStatus(
                user.getId(), request.bookId(), ReservationStatus.PENDING)) {
            throw new BusinessException("You already have a pending reservation for this book");
        }

        Reservation reservation = new Reservation();
        reservation.setUserId(user.getId());
        reservation.setBookId(request.bookId());
        reservation.setReserveDate(LocalDateTime.now());
        reservation.setExpiryDate(LocalDateTime.now().plusDays(7));
        reservation.setStatus(ReservationStatus.PENDING);
        reservation = reservationRepository.save(reservation);

        return ReservationResponse.from(reservation, user.getUsername(), book.getTitle());
    }

    public ReservationResponse cancel(Long reservationId, String currentUsername, boolean isLibrarian) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));

        if (!isLibrarian && !reservation.getUserId().equals(
                userRepository.findByUsername(currentUsername)
                        .orElseThrow(() -> new ResourceNotFoundException("User", currentUsername))
                        .getId())) {
            throw new BusinessException("You can only cancel your own reservations");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation saved = reservationRepository.save(reservation);

        User user = userRepository.findById(saved.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", saved.getUserId()));
        Book book = bookRepository.findById(saved.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book", saved.getBookId()));

        return ReservationResponse.from(saved, user.getUsername(), book.getTitle());
    }

    public Page<ReservationResponse> getReservations(Long userId, String status,
                                                     Pageable pageable,
                                                     String currentUsername,
                                                     User.Role role) {
        if (role == User.Role.USER) {
            User user = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new ResourceNotFoundException("User", currentUsername));
            return reservationRepository.findByUserId(user.getId(), pageable)
                    .map(r -> {
                        User u = userRepository.findById(r.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException("User", r.getUserId()));
                        Book b = bookRepository.findById(r.getBookId())
                                .orElseThrow(() -> new ResourceNotFoundException("Book", r.getBookId()));
                        return ReservationResponse.from(r, u.getUsername(), b.getTitle());
                    });
        }

        if (userId != null) {
            return reservationRepository.findByUserId(userId, pageable)
                    .map(r -> {
                        User u = userRepository.findById(r.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException("User", r.getUserId()));
                        Book b = bookRepository.findById(r.getBookId())
                                .orElseThrow(() -> new ResourceNotFoundException("Book", r.getBookId()));
                        return ReservationResponse.from(r, u.getUsername(), b.getTitle());
                    });
        }

        if (status != null) {
            ReservationStatus filterStatus = ReservationStatus.valueOf(status.toUpperCase());
            return reservationRepository.findByStatus(filterStatus, pageable)
                    .map(r -> {
                        User u = userRepository.findById(r.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException("User", r.getUserId()));
                        Book b = bookRepository.findById(r.getBookId())
                                .orElseThrow(() -> new ResourceNotFoundException("Book", r.getBookId()));
                        return ReservationResponse.from(r, u.getUsername(), b.getTitle());
                    });
        }

        return reservationRepository.findAll(pageable)
                .map(r -> {
                    User u = userRepository.findById(r.getUserId())
                            .orElseThrow(() -> new ResourceNotFoundException("User", r.getUserId()));
                    Book b = bookRepository.findById(r.getBookId())
                            .orElseThrow(() -> new ResourceNotFoundException("Book", r.getBookId()));
                    return ReservationResponse.from(r, u.getUsername(), b.getTitle());
                });
    }

    public Page<ReservationResponse> findAllByStatus(ReservationStatus status, Pageable pageable) {
        return reservationRepository.findByStatus(status, pageable)
                .map(r -> {
                    User u = userRepository.findById(r.getUserId())
                            .orElseThrow(() -> new ResourceNotFoundException("User", r.getUserId()));
                    Book b = bookRepository.findById(r.getBookId())
                            .orElseThrow(() -> new ResourceNotFoundException("Book", r.getBookId()));
                    return ReservationResponse.from(r, u.getUsername(), b.getTitle());
                });
    }
}
