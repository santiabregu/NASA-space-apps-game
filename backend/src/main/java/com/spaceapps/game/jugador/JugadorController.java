package com.spaceapps.game.jugador;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
        return JugadorResponse.de(buscar(token));
    }

    // El jugador ha aceptado la misión de la transmisión inicial: no se le vuelve a mostrar.
    @PostMapping("/intro")
    @Transactional
    JugadorResponse marcarIntroVista(@AuthenticationPrincipal Jwt token) {
        Jugador jugador = buscar(token);
        jugador.marcarIntroVista();
        return JugadorResponse.de(jugador);
    }

    // El jugador ha visto su final y sigue en modo libre: no se le vuelve a mostrar.
    @PostMapping("/final")
    @Transactional
    JugadorResponse marcarFinalVisto(@AuthenticationPrincipal Jwt token) {
        Jugador jugador = buscar(token);
        if (jugador.getFinalCampana() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Your campaign has not ended yet");
        }
        jugador.marcarFinalVisto();
        return JugadorResponse.de(jugador);
    }

    private Jugador buscar(Jwt token) {
        long jugadorId = Long.parseLong(token.getSubject());
        return jugadores.findById(jugadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account " + jugadorId + " no longer exists"));
    }
}
