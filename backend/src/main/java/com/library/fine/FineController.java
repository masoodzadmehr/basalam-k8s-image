package com.library.fine;

import com.library.fine.dto.FineResponse;
import com.library.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fines")
public class FineController {

    private final FineService fineService;

    public FineController(FineService fineService) {
        this.fineService = fineService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<FineResponse>> getFines(
            @RequestParam(required = false) Long userId,
            Pageable pageable,
            Authentication authentication) {
        String username = authentication.getName();
        String roleStr = authentication.getAuthorities().stream()
                .filter(a -> a.getAuthority().startsWith("ROLE_"))
                .findFirst()
                .map(a -> a.getAuthority().substring(5))
                .orElse("USER");
        User.Role role = User.Role.valueOf(roleStr);
        return ResponseEntity.ok(fineService.getFines(userId, pageable, username, role));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FineResponse> getFine(@PathVariable Long id) {
        return ResponseEntity.ok(fineService.getFine(id));
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('LIBRARIAN','ADMIN')")
    public ResponseEntity<FineResponse> payFine(@PathVariable Long id) {
        return ResponseEntity.ok(fineService.payFine(id));
    }
}
