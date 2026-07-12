package com.library.borrowing;

import com.library.book.Book;
import com.library.book.BookRepository;
import com.library.borrowing.Borrowing.BorrowingStatus;
import com.library.borrowing.dto.BorrowingResponse;
import com.library.borrowing.dto.BorrowRequest;
import com.library.common.exception.BusinessException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.reservation.Reservation;
import com.library.reservation.Reservation.ReservationStatus;
import com.library.reservation.ReservationRepository;
import com.library.user.User;
import com.library.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class BorrowingService {

    private final BorrowingRepository borrowingRepository;
    private final BorrowingConfigRepository borrowingConfigRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;

    public BorrowingService(BorrowingRepository borrowingRepository,
                            BorrowingConfigRepository borrowingConfigRepository,
                            BookRepository bookRepository,
                            UserRepository userRepository,
                            ReservationRepository reservationRepository) {
        this.borrowingRepository = borrowingRepository;
        this.borrowingConfigRepository = borrowingConfigRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
    }

    public BorrowingResponse borrow(BorrowRequest request, String currentUsername) {
        User borrower = resolveBorrower(request.userId(), currentUsername);
        BorrowingConfig config = getConfig();

        int activeCount = borrowingRepository.countActiveByUserId(borrower.getId());
        if (activeCount >= config.getMaxBooksPerUser()) {
            throw new BusinessException(
                    "Borrowing limit reached (" + config.getMaxBooksPerUser() + " books)");
        }

        Book book = bookRepository.findById(request.bookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book", request.bookId()));

        long activeBorrowings = bookRepository.countActiveBorrowings(book.getId());
        if (book.getCopiesCount() - activeBorrowings <= 0) {
            throw new BusinessException("No copies available");
        }

        Borrowing borrowing = new Borrowing();
        borrowing.setUserId(borrower.getId());
        borrowing.setBookId(request.bookId());
        borrowing.setBorrowDate(LocalDateTime.now());
        borrowing.setDueDate(LocalDateTime.now().plusDays(config.getLoanDurationDays()));
        borrowing.setStatus(BorrowingStatus.BORROWED);
        borrowing = borrowingRepository.save(borrowing);

        reservationRepository.findByUserIdAndBookIdAndStatus(
                        borrower.getId(), request.bookId(), ReservationStatus.PENDING)
                .ifPresent(reservation -> {
                    reservation.setStatus(ReservationStatus.FULFILLED);
                    reservation.setFulfilledDate(LocalDateTime.now());
                    reservationRepository.save(reservation);
                });

        return BorrowingResponse.from(borrowing, borrower.getUsername(), book.getTitle());
    }

    public BorrowingResponse returnBook(Long borrowingId) {
        Borrowing borrowing = borrowingRepository.findById(borrowingId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrowing", borrowingId));

        if (borrowing.getStatus() == BorrowingStatus.RETURNED) {
            throw new BusinessException("Book already returned");
        }

        borrowing.setStatus(BorrowingStatus.RETURNED);
        borrowing.setReturnDate(LocalDateTime.now());
        borrowing = borrowingRepository.save(borrowing);

        return toResponse(borrowing);
    }

    public BorrowingResponse extend(Long borrowingId) {
        Borrowing borrowing = borrowingRepository.findById(borrowingId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrowing", borrowingId));

        if (borrowing.getStatus() == BorrowingStatus.OVERDUE) {
            throw new BusinessException("Cannot extend overdue book - please return first");
        }

        BorrowingConfig config = getConfig();

        if (borrowing.getExtensionCount() >= config.getMaxExtensions()) {
            throw new BusinessException(
                    "Extension limit reached (" + config.getMaxExtensions() + ")");
        }

        borrowing.setExtensionCount(borrowing.getExtensionCount() + 1);
        borrowing.setDueDate(borrowing.getDueDate().plusDays(config.getExtendDurationDays()));
        borrowing.setStatus(BorrowingStatus.EXTENDED);
        borrowing = borrowingRepository.save(borrowing);

        return toResponse(borrowing);
    }

    public Page<BorrowingResponse> getBorrowings(Long userId, String status,
                                                  Pageable pageable,
                                                  String currentUsername,
                                                  User.Role role) {
        if (role == User.Role.USER) {
            User user = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new ResourceNotFoundException("User", currentUsername));
            return borrowingRepository.findByUserId(user.getId(), pageable)
                    .map(this::toResponse);
        }

        if (userId != null) {
            return borrowingRepository.findByUserId(userId, pageable)
                    .map(this::toResponse);
        }

        if (status != null) {
            BorrowingStatus filterStatus = BorrowingStatus.valueOf(status.toUpperCase());
            return borrowingRepository.findByStatus(filterStatus, pageable)
                    .map(this::toResponse);
        }

        return borrowingRepository.findActive(pageable)
                .map(this::toResponse);
    }

    public BorrowingResponse getBorrowing(Long id) {
        Borrowing borrowing = borrowingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Borrowing", id));
        return toResponse(borrowing);
    }

    public List<BorrowingResponse> getOverdue() {
        return borrowingRepository.findOverdue(LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private User resolveBorrower(Long requestUserId, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", currentUsername));

        if (currentUser.getRole() != User.Role.USER && requestUserId != null) {
            return userRepository.findById(requestUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", requestUserId));
        }

        return currentUser;
    }

    private BorrowingConfig getConfig() {
        return borrowingConfigRepository.findById(1L)
                .orElseThrow(() -> new BusinessException("Borrowing configuration not found"));
    }

    private BorrowingResponse toResponse(Borrowing borrowing) {
        User user = userRepository.findById(borrowing.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", borrowing.getUserId()));
        Book book = bookRepository.findById(borrowing.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book", borrowing.getBookId()));
        return BorrowingResponse.from(borrowing, user.getUsername(), book.getTitle());
    }
}
