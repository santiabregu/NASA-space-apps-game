package com.spaceapps.game.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// BCrypt solo usa los primeros 72 bytes de la contraseña: el máximo de 64 caracteres deja margen para tildes.
public record RegistroRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 64) String password,
        @NotBlank @Size(min = 3, max = 20) String nombreUsuario,
        @NotBlank @Size(min = 2, max = 40) String nombreEmpresa) {
}
