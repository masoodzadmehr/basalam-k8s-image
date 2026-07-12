package com.library.user;

import com.library.common.exception.BusinessException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.user.dto.UpdateProfileRequest;
import com.library.user.dto.UpdateRoleRequest;
import com.library.user.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));
        return UserResponse.from(user);
    }

    public UserResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.mobile() != null) {
            user.setMobile(request.mobile());
        }

        user = userRepository.save(user);
        return UserResponse.from(user);
    }

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(UserResponse::from);
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return UserResponse.from(user);
    }

    public UserResponse updateRole(Long id, UpdateRoleRequest request) {
        User.Role role;
        try {
            role = User.Role.valueOf(request.role().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid role: " + request.role());
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (user.getRole() == User.Role.ADMIN
                && role != User.Role.ADMIN
                && userRepository.existsByRole(User.Role.ADMIN)) {
            long adminCount = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.Role.ADMIN)
                    .count();
            if (adminCount <= 1) {
                throw new BusinessException("Cannot remove the last admin");
            }
        }

        user.setRole(role);
        user = userRepository.save(user);
        return UserResponse.from(user);
    }
}
