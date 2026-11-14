package com.spaceapps.game.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
class AuthController {

    private final AuthService authService;

    AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    TokenResponse registrar(@Valid @RequestBody RegistroRequest datos) {
        return new TokenResponse(authService.registrar(datos));
    }

    @PostMapping("/login")
    TokenResponse iniciarSesion(@Valid @RequestBody LoginRequest credenciales) {
        return new TokenResponse(authService.iniciarSesion(credenciales));
    }
}
