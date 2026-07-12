package com.library.borrowing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "borrowing_config")
public class BorrowingConfig {

    @Id
    private Long id = 1L;

    @Column(name = "max_books_per_user", nullable = false)
    private int maxBooksPerUser;

    @Column(name = "loan_duration_days", nullable = false)
    private int loanDurationDays;

    @Column(name = "extend_duration_days", nullable = false)
    private int extendDurationDays;

    @Column(name = "max_extensions", nullable = false)
    private int maxExtensions;

    @Column(name = "fine_per_day_irt", nullable = false, precision = 15, scale = 2)
    private BigDecimal finePerDayIrt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getMaxBooksPerUser() {
        return maxBooksPerUser;
    }

    public void setMaxBooksPerUser(int maxBooksPerUser) {
        this.maxBooksPerUser = maxBooksPerUser;
    }

    public int getLoanDurationDays() {
        return loanDurationDays;
    }

    public void setLoanDurationDays(int loanDurationDays) {
        this.loanDurationDays = loanDurationDays;
    }

    public int getExtendDurationDays() {
        return extendDurationDays;
    }

    public void setExtendDurationDays(int extendDurationDays) {
        this.extendDurationDays = extendDurationDays;
    }

    public int getMaxExtensions() {
        return maxExtensions;
    }

    public void setMaxExtensions(int maxExtensions) {
        this.maxExtensions = maxExtensions;
    }

    public BigDecimal getFinePerDayIrt() {
        return finePerDayIrt;
    }

    public void setFinePerDayIrt(BigDecimal finePerDayIrt) {
        this.finePerDayIrt = finePerDayIrt;
    }
}
