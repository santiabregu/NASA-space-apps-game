package com.spaceapps.game.amigos;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.spaceapps.game.amigos.AmigosResponse.Contacto;
import com.spaceapps.game.amigos.ResultadoBusqueda.Relacion;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

@Service
public class AmigosService {

    private final AmistadRepository amistades;
    private final JugadorRepository jugadores;

    AmigosService(AmistadRepository amistades, JugadorRepository jugadores) {
        this.amistades = amistades;
        this.jugadores = jugadores;
    }

    @Transactional(readOnly = true)
    public AmigosResponse resumen(long jugadorId) {
        List<Amistad> todas = amistades.delJugador(jugadorId);
        return new AmigosResponse(
                contactos(todas.stream().filter(Amistad::isAceptada).toList(), jugadorId),
                contactos(todas.stream().filter(a -> !a.isAceptada() && a.getDestinatario().getId() == jugadorId).toList(), jugadorId),
                contactos(todas.stream().filter(a -> !a.isAceptada() && a.getSolicitante().getId() == jugadorId).toList(), jugadorId));
    }

    @Transactional(readOnly = true)
    public boolean sonAmigos(long uno, long otro) {
        return amistades.entre(uno, otro).filter(Amistad::isAceptada).isPresent();
    }

    @Transactional(readOnly = true)
    List<ResultadoBusqueda> buscar(long jugadorId, String texto) {
        Map<Long, Amistad> relaciones = amistades.delJugador(jugadorId).stream()
                .collect(Collectors.toMap(amistad -> amistad.otro(jugadorId).getId(), Function.identity()));
        return jugadores.findTop10ByNombreUsuarioContainingIgnoreCaseAndIdNotOrderByNombreUsuario(texto.trim(), jugadorId).stream()
                .map(jugador -> new ResultadoBusqueda(PerfilPublico.de(jugador), relacion(relaciones.get(jugador.getId()), jugadorId)))
                .toList();
    }

    // Si el otro ya nos había pedido amistad, pedírsela a él equivale a aceptarla.
    @Transactional
    public AmigosResponse solicitar(long jugadorId, long otroId) {
        Jugador yo = buscarJugador(jugadorId);
        Jugador otro = jugadores.findById(otroId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "That player no longer exists"));
        if (otro.getId() == jugadorId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot add yourself as a friend");
        }
        amistades.entre(jugadorId, otro.getId()).ifPresentOrElse(existente -> {
            if (existente.isAceptada()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, otro.getNombreUsuario() + " is already your friend");
            }
            if (existente.getSolicitante().getId() == jugadorId) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "You already sent a request to " + otro.getNombreUsuario());
            }
            existente.aceptar();
        }, () -> amistades.save(new Amistad(yo, otro)));
        return resumen(jugadorId);
    }

    @Transactional
    public AmigosResponse aceptar(long jugadorId, long amistadId) {
        Amistad amistad = buscarAmistad(jugadorId, amistadId);
        if (amistad.isAceptada() || amistad.getDestinatario().getId() != jugadorId) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This request is not waiting for your answer");
        }
        amistad.aceptar();
        return resumen(jugadorId);
    }

    // Sirve para rechazar una solicitud, cancelar una enviada o dejar de ser amigos.
    @Transactional
    AmigosResponse eliminar(long jugadorId, long amistadId) {
        amistades.delete(buscarAmistad(jugadorId, amistadId));
        return resumen(jugadorId);
    }

    private static List<Contacto> contactos(List<Amistad> lista, long jugadorId) {
        return lista.stream()
                .map(amistad -> new Contacto(amistad.getId(), PerfilPublico.de(amistad.otro(jugadorId))))
                .sorted((a, b) -> a.jugador().nombreUsuario().compareToIgnoreCase(b.jugador().nombreUsuario()))
                .toList();
    }

    private static Relacion relacion(Amistad amistad, long jugadorId) {
        if (amistad == null) {
            return Relacion.NINGUNA;
        }
        if (amistad.isAceptada()) {
            return Relacion.AMIGO;
        }
        return amistad.getSolicitante().getId() == jugadorId ? Relacion.ENVIADA : Relacion.RECIBIDA;
    }

    private Amistad buscarAmistad(long jugadorId, long amistadId) {
        return amistades.findById(amistadId)
                .filter(amistad -> amistad.participa(jugadorId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend request " + amistadId + " not found"));
    }

    private Jugador buscarJugador(long jugadorId) {
        return jugadores.findById(jugadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account " + jugadorId + " no longer exists"));
    }
}
