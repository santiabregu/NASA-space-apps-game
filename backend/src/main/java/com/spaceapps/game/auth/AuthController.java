package com.spaceapps.game.auth;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
class AuthController {

    private final AuthService authService;

    AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Crea la partida la primera vez y la continúa las siguientes.
    @PostMapping("/entrar")
    TokenResponse entrar(@Valid @RequestBody EntradaRequest datos) {
        return new TokenResponse(authService.entrar(datos));
    }
}
