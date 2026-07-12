package com.library.user.dto;

import com.library.user.User;

import java.util.UUID;

public record UserResponse(
        Long id,
        UUID uid,
        String username,
        String email,
        String firstName,
        String lastName,
        String mobile,
        String role,
        boolean enabled
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUid(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getMobile(),
                user.getRole().name(),
                user.isEnabled()
        );
    }
}
