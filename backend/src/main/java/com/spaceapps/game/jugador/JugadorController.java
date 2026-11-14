package com.spaceapps.game.jugador;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/jugador")
class JugadorController {

    private final JugadorRepository jugadores;

    JugadorController(JugadorRepository jugadores) {
        this.jugadores = jugadores;
    }

    @GetMapping("/me")
    JugadorResponse yo(@AuthenticationPrincipal Jwt token) {
        long jugadorId = Long.parseLong(token.getSubject());
        return jugadores.findById(jugadorId)
                .map(JugadorResponse::de)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La cuenta " + jugadorId + " ya no existe"));
    }
}
