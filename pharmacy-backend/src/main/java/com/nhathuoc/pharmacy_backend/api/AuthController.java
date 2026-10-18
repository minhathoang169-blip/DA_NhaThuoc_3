package com.nhathuoc.pharmacy_backend.api;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @GetMapping("/me")
    public AuthResponse me(Authentication authentication) {
        return new AuthResponse(authentication.getName());
    }

    public record AuthResponse(String username) {}
}
