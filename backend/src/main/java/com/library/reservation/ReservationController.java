package com.library.reservation;

import com.library.reservation.dto.ReservationRequest;
import com.library.reservation.dto.ReservationResponse;
import com.library.user.User;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReservationResponse> reserve(@Valid @RequestBody ReservationRequest request,
                                                       Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservationService.reserve(request, username));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<ReservationResponse>> getReservations(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String status,
            Pageable pageable,
            Authentication authentication) {
        String username = authentication.getName();
        String roleStr = authentication.getAuthorities().stream()
                .filter(a -> a.getAuthority().startsWith("ROLE_"))
                .findFirst()
                .map(a -> a.getAuthority().substring(5))
                .orElse("USER");
        User.Role role = User.Role.valueOf(roleStr);
        return ResponseEntity.ok(
                reservationService.getReservations(userId, status, pageable, username, role));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReservationResponse> cancel(@PathVariable Long id,
                                                      Authentication authentication) {
        String username = authentication.getName();
        boolean isLibrarian = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LIBRARIAN")
                        || a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(reservationService.cancel(id, username, isLibrarian));
    }
}
