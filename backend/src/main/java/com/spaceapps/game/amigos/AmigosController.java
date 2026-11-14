package com.spaceapps.game.amigos;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/amigos")
@Validated
class AmigosController {

    private final AmigosService amigos;

    AmigosController(AmigosService amigos) {
        this.amigos = amigos;
    }

    @GetMapping
    AmigosResponse resumen(@AuthenticationPrincipal Jwt token) {
        return amigos.resumen(jugadorId(token));
    }

    @GetMapping("/buscar")
    List<ResultadoBusqueda> buscar(@AuthenticationPrincipal Jwt token, @RequestParam @NotBlank @Size(min = 2, max = 30) String texto) {
        return amigos.buscar(jugadorId(token), texto);
    }

    @PostMapping("/solicitudes")
    AmigosResponse solicitar(@AuthenticationPrincipal Jwt token, @Valid @RequestBody SolicitudAmistadRequest solicitud) {
        return amigos.solicitar(jugadorId(token), solicitud.nombreUsuario());
    }

    @PostMapping("/{amistadId}/aceptar")
    AmigosResponse aceptar(@AuthenticationPrincipal Jwt token, @PathVariable long amistadId) {
        return amigos.aceptar(jugadorId(token), amistadId);
    }

    @DeleteMapping("/{amistadId}")
    AmigosResponse eliminar(@AuthenticationPrincipal Jwt token, @PathVariable long amistadId) {
        return amigos.eliminar(jugadorId(token), amistadId);
    }

    private static long jugadorId(Jwt token) {
        return Long.parseLong(token.getSubject());
    }
}
