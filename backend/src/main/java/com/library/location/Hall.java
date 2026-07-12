package com.library.location;

import com.library.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "halls")
public class Hall extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "librarian_user_id")
    private Long librarianUserId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getLibrarianUserId() {
        return librarianUserId;
    }

    public void setLibrarianUserId(Long librarianUserId) {
        this.librarianUserId = librarianUserId;
    }
}
