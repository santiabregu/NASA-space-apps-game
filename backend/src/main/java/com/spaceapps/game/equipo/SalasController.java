package com.spaceapps.game.equipo;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.spaceapps.game.equipo.SalaResponse.InvitacionResponse;

import tools.jackson.databind.JsonNode;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/salas")
class SalasController {

    record CrearSalaRequest(@NotBlank @Size(max = 40) String estrellaId) {
    }

    record InvitarRequest(long jugadorId) {
    }

    // datos es el JSON del minijuego de cada departamento; la sala comprueba su forma y su tamaño.
    record DatosFaseRequest(JsonNode datos) {
    }

    record LanzamientoRequest(boolean exito, JsonNode informe) {
    }

    record VotosRequest(@NotNull @Size(max = 10) List<@NotBlank @Size(max = 40) String> piezaIds) {
    }

    private final SalasService salas;

    SalasController(SalasService salas) {
        this.salas = salas;
    }

    @PostMapping
    SalaResponse crear(@AuthenticationPrincipal Jwt token, @Valid @RequestBody CrearSalaRequest peticion) {
        return salas.crear(jugadorId(token), peticion.estrellaId());
    }

    // 204 si el jugador no está en ninguna sala.
    @GetMapping("/mia")
    ResponseEntity<SalaResponse> mia(@AuthenticationPrincipal Jwt token) {
        return salas.mia(jugadorId(token))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/invitaciones")
    List<InvitacionResponse> invitaciones(@AuthenticationPrincipal Jwt token) {
        return salas.invitaciones(jugadorId(token));
    }

    // 204 si la sala no ha cambiado desde la versión que ya tiene el navegador.
    @GetMapping("/{codigo}")
    ResponseEntity<SalaResponse> ver(@AuthenticationPrincipal Jwt token, @PathVariable String codigo,
            @RequestParam(required = false) Long version) {
        return salas.ver(jugadorId(token), codigo, version)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/{codigo}/unirse")
    SalaResponse unirse(@AuthenticationPrincipal Jwt token, @PathVariable String codigo) {
        return salas.unirse(jugadorId(token), codigo);
    }

    @PostMapping("/{codigo}/invitar")
    SalaResponse invitar(@AuthenticationPrincipal Jwt token, @PathVariable String codigo, @RequestBody InvitarRequest peticion) {
        return salas.invitar(jugadorId(token), codigo, peticion.jugadorId());
    }

    @PostMapping("/{codigo}/salir")
    ResponseEntity<Void> salir(@AuthenticationPrincipal Jwt token, @PathVariable String codigo) {
        salas.salir(jugadorId(token), codigo);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{codigo}/empezar")
    SalaResponse empezar(@AuthenticationPrincipal Jwt token, @PathVariable String codigo) {
        return salas.empezar(jugadorId(token), codigo);
    }

    @PostMapping("/{codigo}/fases/{departamento}/progreso")
    SalaResponse progreso(@AuthenticationPrincipal Jwt token, @PathVariable String codigo, @PathVariable Departamento departamento,
            @RequestBody DatosFaseRequest peticion) {
        return salas.enviarProgreso(jugadorId(token), codigo, departamento, peticion.datos());
    }

    @PostMapping("/{codigo}/fases/{departamento}/resultado")
    SalaResponse resultado(@AuthenticationPrincipal Jwt token, @PathVariable String codigo, @PathVariable Departamento departamento,
            @RequestBody DatosFaseRequest peticion) {
        return salas.enviarResultado(jugadorId(token), codigo, departamento, peticion.datos());
    }

    @PostMapping("/{codigo}/fases/{departamento}/votos")
    SalaResponse votos(@AuthenticationPrincipal Jwt token, @PathVariable String codigo, @PathVariable Departamento departamento,
            @Valid @RequestBody VotosRequest peticion) {
        return salas.votar(jugadorId(token), codigo, departamento, peticion.piezaIds());
    }

    @PostMapping("/{codigo}/lanzamiento")
    SalaResponse lanzamiento(@AuthenticationPrincipal Jwt token, @PathVariable String codigo, @RequestBody LanzamientoRequest peticion) {
        return salas.lanzar(jugadorId(token), codigo, peticion.exito(), peticion.informe());
    }

    private static long jugadorId(Jwt token) {
        return Long.parseLong(token.getSubject());
    }
}
