package com.library.fine;

import com.library.book.Book;
import com.library.book.BookRepository;
import com.library.borrowing.Borrowing;
import com.library.common.exception.ResourceNotFoundException;
import com.library.fine.dto.FineResponse;
import com.library.user.User;
import com.library.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@Transactional
public class FineService {

    private final FineRepository fineRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final com.library.borrowing.BorrowingRepository borrowingRepository;

    public FineService(FineRepository fineRepository,
                       UserRepository userRepository,
                       BookRepository bookRepository,
                       com.library.borrowing.BorrowingRepository borrowingRepository) {
        this.fineRepository = fineRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.borrowingRepository = borrowingRepository;
    }

    public FineResponse calculateAndCreateFine(Borrowing borrowing, BigDecimal dailyRate) {
        LocalDateTime dueDate = borrowing.getDueDate();
        LocalDateTime returnDate = borrowing.getReturnDate() != null
                ? borrowing.getReturnDate() : LocalDateTime.now();

        long daysOverdue = ChronoUnit.DAYS.between(dueDate, returnDate);
        if (daysOverdue < 0) {
            daysOverdue = 0;
        }

        BigDecimal amount = dailyRate.multiply(BigDecimal.valueOf(daysOverdue))
                .setScale(2, RoundingMode.HALF_UP);

        Fine fine = new Fine();
        fine.setBorrowingId(borrowing.getId());
        fine.setUserId(borrowing.getUserId());
        fine.setAmount(amount);
        fine.setDailyRate(dailyRate);
        fine.setDaysOverdue((int) daysOverdue);
        fine.setPaid(false);
        fine = fineRepository.save(fine);

        return toResponse(fine);
    }

    public Page<FineResponse> getFines(Long userId, Pageable pageable,
                                       String currentUsername, User.Role role) {
        if (role == User.Role.USER) {
            User user = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new ResourceNotFoundException("User", currentUsername));
            return fineRepository.findByUserId(user.getId(), pageable)
                    .map(this::toResponse);
        }

        if (userId != null) {
            return fineRepository.findByUserId(userId, pageable)
                    .map(this::toResponse);
        }

        return fineRepository.findByPaidFalse(pageable)
                .map(this::toResponse);
    }

    public FineResponse getFine(Long id) {
        Fine fine = fineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fine", id));
        return toResponse(fine);
    }

    public FineResponse payFine(Long id) {
        Fine fine = fineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fine", id));

        fine.setPaid(true);
        fine.setPaidDate(LocalDateTime.now());
        fine = fineRepository.save(fine);

        return toResponse(fine);
    }

    private FineResponse toResponse(Fine fine) {
        User user = userRepository.findById(fine.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", fine.getUserId()));

        Borrowing borrowing = borrowingRepository.findById(fine.getBorrowingId())
                .orElseThrow(() -> new ResourceNotFoundException("Borrowing", fine.getBorrowingId()));

        Book book = bookRepository.findById(borrowing.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book", borrowing.getBookId()));

        return FineResponse.from(fine, user.getUsername(), book.getTitle());
    }
}
