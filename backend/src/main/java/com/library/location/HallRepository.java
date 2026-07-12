package com.library.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HallRepository extends JpaRepository<Hall, Long> {

    List<Hall> findByLibrarianUserId(Long librarianUserId);

    boolean existsByLibrarianUserId(Long librarianUserId);
}
