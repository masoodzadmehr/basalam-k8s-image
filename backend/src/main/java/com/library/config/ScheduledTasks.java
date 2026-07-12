package com.library.config;

import com.library.book.Book;
import com.library.book.BookRepository;
import com.library.borrowing.Borrowing;
import com.library.borrowing.Borrowing.BorrowingStatus;
import com.library.borrowing.BorrowingRepository;
import com.library.notification.NotificationService;
import com.library.notification.NotificationType;
import com.library.reservation.Reservation;
import com.library.reservation.Reservation.ReservationStatus;
import com.library.reservation.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@Transactional
public class ScheduledTasks {

    private static final Logger log = LoggerFactory.getLogger(ScheduledTasks.class);

    private final BorrowingRepository borrowingRepository;
    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;
    private final BookRepository bookRepository;

    public ScheduledTasks(BorrowingRepository borrowingRepository,
                          ReservationRepository reservationRepository,
                          NotificationService notificationService,
                          BookRepository bookRepository) {
        this.borrowingRepository = borrowingRepository;
        this.reservationRepository = reservationRepository;
        this.notificationService = notificationService;
        this.bookRepository = bookRepository;
    }

    @Scheduled(cron = "0 0 8 * * *")
    public void checkOverdueBooks() {
        log.info("Running overdue books check...");
        var overdue = borrowingRepository.findOverdue(LocalDateTime.now());

        for (Borrowing borrowing : overdue) {
            if (borrowing.getStatus() != BorrowingStatus.OVERDUE) {
                borrowing.setStatus(BorrowingStatus.OVERDUE);
                borrowingRepository.save(borrowing);
            }

            String bookTitle = bookRepository.findById(borrowing.getBookId())
                    .map(Book::getTitle)
                    .orElse("Unknown");

            String message = "Book " + bookTitle + " is overdue. Please return it as soon as possible.";
            notificationService.createNotification(borrowing.getUserId(), message, NotificationType.OVERDUE);
        }

        log.info("Overdue books check completed. Found {} overdue entries.", overdue.size());
    }

    @Scheduled(cron = "0 0 * * * *")
    public void expirePendingReservations() {
        log.info("Running pending reservation expiry check...");
        var expired = reservationRepository.findExpiredPending(LocalDateTime.now());

        for (Reservation reservation : expired) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);

            String bookTitle = bookRepository.findById(reservation.getBookId())
                    .map(Book::getTitle)
                    .orElse("Unknown");

            String message = "Your reservation for " + bookTitle + " has expired.";
            notificationService.createNotification(reservation.getUserId(), message, NotificationType.RESERVATION_EXPIRED);
        }

        log.info("Pending reservation expiry check completed. Expired {} reservations.", expired.size());
    }

    @Scheduled(cron = "0 0 * * * *")
    public void expireFulfilledReservations() {
        log.info("Running fulfilled reservation expiry check...");
        var cutoff = LocalDateTime.now().minusHours(24);
        var expired = reservationRepository.findExpiredFulfilled(cutoff);

        for (Reservation reservation : expired) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);

            String bookTitle = bookRepository.findById(reservation.getBookId())
                    .map(Book::getTitle)
                    .orElse("Unknown");

            String message = "Your fulfilled reservation for " + bookTitle + " has expired (24h window).";
            notificationService.createNotification(reservation.getUserId(), message, NotificationType.RESERVATION_EXPIRED);
        }

        log.info("Fulfilled reservation expiry check completed. Expired {} reservations.", expired.size());
    }
}
