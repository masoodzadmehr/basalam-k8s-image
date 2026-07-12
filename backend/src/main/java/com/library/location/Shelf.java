package com.library.location;

import com.library.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "shelves")
public class Shelf extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "bookshelf_id", nullable = false)
    private Long bookshelfId;

    @Column(name = "librarian_user_id")
    private Long librarianUserId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getBookshelfId() {
        return bookshelfId;
    }

    public void setBookshelfId(Long bookshelfId) {
        this.bookshelfId = bookshelfId;
    }

    public Long getLibrarianUserId() {
        return librarianUserId;
    }

    public void setLibrarianUserId(Long librarianUserId) {
        this.librarianUserId = librarianUserId;
    }
}
