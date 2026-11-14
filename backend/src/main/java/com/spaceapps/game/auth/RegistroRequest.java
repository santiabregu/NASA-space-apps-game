package com.spaceapps.game.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// BCrypt only uses the first 72 bytes of a password: the 64-character limit leaves room for multi-byte characters.
public record RegistroRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address") String email,
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 64, message = "Password must be 8 to 64 characters") String password,
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 20, message = "Username must be 3 to 20 characters") String nombreUsuario,
        @NotBlank(message = "Company name is required")
        @Size(min = 2, max = 40, message = "Company name must be 2 to 40 characters") String nombreEmpresa) {
}
