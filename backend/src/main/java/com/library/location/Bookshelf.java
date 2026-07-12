package com.library.location;

import com.library.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "bookshelves")
public class Bookshelf extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "hall_id", nullable = false)
    private Long hallId;

    @Column(name = "librarian_user_id")
    private Long librarianUserId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getHallId() {
        return hallId;
    }

    public void setHallId(Long hallId) {
        this.hallId = hallId;
    }

    public Long getLibrarianUserId() {
        return librarianUserId;
    }

    public void setLibrarianUserId(Long librarianUserId) {
        this.librarianUserId = librarianUserId;
    }
}
