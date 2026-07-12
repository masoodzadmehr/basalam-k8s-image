package com.library.borrowing;

import com.library.borrowing.dto.BorrowingResponse;
import com.library.borrowing.dto.BorrowRequest;
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

import java.util.List;

@RestController
@RequestMapping("/api/borrowings")
public class BorrowingController {

    private final BorrowingService borrowingService;

    public BorrowingController(BorrowingService borrowingService) {
        this.borrowingService = borrowingService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BorrowingResponse> borrow(@Valid @RequestBody BorrowRequest request,
                                                     Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(borrowingService.borrow(request, username));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<BorrowingResponse>> getBorrowings(
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
                borrowingService.getBorrowings(userId, status, pageable, username, role));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BorrowingResponse> getBorrowing(@PathVariable Long id) {
        return ResponseEntity.ok(borrowingService.getBorrowing(id));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    public ResponseEntity<BorrowingResponse> returnBook(@PathVariable Long id) {
        return ResponseEntity.ok(borrowingService.returnBook(id));
    }

    @PostMapping("/{id}/extend")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BorrowingResponse> extend(@PathVariable Long id) {
        return ResponseEntity.ok(borrowingService.extend(id));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    public ResponseEntity<List<BorrowingResponse>> getOverdue() {
        return ResponseEntity.ok(borrowingService.getOverdue());
    }
}
