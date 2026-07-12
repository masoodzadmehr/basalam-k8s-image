package com.library.config;

import com.library.borrowing.BorrowingConfig;
import com.library.borrowing.BorrowingConfigRepository;
import com.library.config.dto.BorrowingConfigResponse;
import com.library.config.dto.BorrowingConfigUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config/borrowing")
public class BorrowingConfigController {

    private final BorrowingConfigRepository borrowingConfigRepository;

    public BorrowingConfigController(BorrowingConfigRepository borrowingConfigRepository) {
        this.borrowingConfigRepository = borrowingConfigRepository;
    }

    @GetMapping
    public ResponseEntity<BorrowingConfigResponse> getConfig() {
        BorrowingConfig config = borrowingConfigRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Borrowing config not found"));
        return ResponseEntity.ok(BorrowingConfigResponse.from(config));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BorrowingConfigResponse> updateConfig(
            @Valid @RequestBody BorrowingConfigUpdateRequest request) {
        BorrowingConfig config = borrowingConfigRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Borrowing config not found"));

        config.setMaxBooksPerUser(request.maxBooksPerUser());
        config.setLoanDurationDays(request.loanDurationDays());
        config.setExtendDurationDays(request.extendDurationDays());
        config.setMaxExtensions(request.maxExtensions());
        config.setFinePerDayIrt(request.finePerDayIrt());

        borrowingConfigRepository.save(config);
        return ResponseEntity.ok(BorrowingConfigResponse.from(config));
    }
}
