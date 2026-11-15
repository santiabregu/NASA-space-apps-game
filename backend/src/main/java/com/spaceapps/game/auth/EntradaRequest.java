package com.spaceapps.game.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EntradaRequest(
        @NotBlank(message = "Your name is required")
        @Size(min = 3, max = 20, message = "Your name must be 3 to 20 characters") String nombreUsuario,
        @NotBlank(message = "Company name is required")
        @Size(min = 2, max = 40, message = "Company name must be 2 to 40 characters") String nombreEmpresa) {
}
