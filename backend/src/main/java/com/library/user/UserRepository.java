package com.library.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUid(UUID uid);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByRole(User.Role role);
}
