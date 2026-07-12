package com.library.user;

import com.library.user.dto.UpdateProfileRequest;
import com.library.user.dto.UpdateRoleRequest;
import com.library.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentUser(authentication.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(Authentication authentication,
                                                       @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(authentication.getName(), request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateRole(@PathVariable Long id,
                                                    @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(userService.updateRole(id, request));
    }
}
