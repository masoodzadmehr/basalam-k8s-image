package com.library.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookshelfRepository extends JpaRepository<Bookshelf, Long> {

    List<Bookshelf> findByHallId(Long hallId);

    List<Bookshelf> findByLibrarianUserId(Long librarianUserId);

    boolean existsByHallIdAndLibrarianUserId(Long hallId, Long librarianUserId);
}
