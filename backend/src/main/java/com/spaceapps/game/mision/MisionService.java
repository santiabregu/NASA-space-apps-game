package com.spaceapps.game.mision;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.spaceapps.game.catalogo.Catalogo;
import com.spaceapps.game.catalogo.MisionCatalogo;
import com.spaceapps.game.catalogo.PiezaCatalogo;
import com.spaceapps.game.catalogo.TipoMision;
import com.spaceapps.game.empresa.Empresa;
import com.spaceapps.game.empresa.NivelConfianza;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;
import com.spaceapps.game.jugador.JugadorResponse;

import tools.jackson.databind.json.JsonMapper;

@Service
class MisionService {

    private final Catalogo catalogo;
    private final JugadorRepository jugadores;
    private final LanzamientoRepository lanzamientos;
    private final JsonMapper jsonMapper;

    MisionService(Catalogo catalogo, JugadorRepository jugadores, LanzamientoRepository lanzamientos, JsonMapper jsonMapper) {
        this.catalogo = catalogo;
        this.jugadores = jugadores;
        this.lanzamientos = lanzamientos;
        this.jsonMapper = jsonMapper;
    }

    List<String> disponibles(long jugadorId) {
        Jugador jugador = buscarJugador(jugadorId);
        return catalogo.misiones().stream()
                .filter(mision -> estaDisponible(mision, jugador))
                .map(MisionCatalogo::id)
                .toList();
    }

    // El resultado lo simula el cliente: el servidor solo garantiza el cobro de las piezas y que la misión y las piezas estén permitidas.
    @Transactional
    LanzamientoResponse lanzar(long jugadorId, String misionId, LanzamientoRequest lanzamiento) {
        Jugador jugador = buscarJugador(jugadorId);
        MisionCatalogo mision = catalogo.mision(misionId)
                .filter(candidata -> estaDisponible(candidata, jugador))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Mission " + misionId + " is not available to you"));

        Empresa empresa = jugador.getEmpresa();
        long coste = costeDePiezas(lanzamiento.piezas(), jugador.getConocimiento().getNivel());
        long prestamo = Math.max(0, coste - jugador.getDinero());
        if (prestamo > 0) {
            if (!lanzamiento.aceptaPrestamo()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The design costs $" + coste + " and your company has $" + jugador.getDinero());
            }
            empresa.pedirPrestamo(prestamo);
            jugador.cobrar(prestamo);
        }
        jugador.pagar(coste);

        Liquidacion liquidacion = Liquidacion.de(mision, lanzamiento.exito(), lanzamiento.puntuacion());
        jugador.cobrar(liquidacion.dinero());
        long deudaDevuelta = Math.min(empresa.getDeuda(), liquidacion.dinero());
        jugador.pagar(deudaDevuelta);
        empresa.devolverDeuda(deudaDevuelta);
        int nivelesSubidos = jugador.getConocimiento().ganarXp(liquidacion.xp());
        empresa.cambiarReputacion(liquidacion.cambioReputacion());
        if (lanzamiento.exito()) {
            jugador.getPerfil().registrarExito(mision.tipo() == TipoMision.TUTORIAL);
            jugador.registrarMisionTerminada(mision.id(), lanzamiento.puntuacion());
        } else {
            jugador.getPerfil().registrarFallo();
        }

        LanzamientoResponse respuesta = new LanzamientoResponse(coste, prestamo, liquidacion.dinero(), deudaDevuelta,
                liquidacion.xp(), liquidacion.cambioReputacion(), nivelesSubidos, JugadorResponse.de(jugador));
        lanzamientos.save(new Lanzamiento(jugador, mision.id(), respuesta, lanzamiento.exito(), lanzamiento.puntuacion(),
                lanzamiento.piezas(), jsonMapper.writeValueAsString(lanzamiento.informe())));
        return respuesta;
    }

    @Transactional(readOnly = true)
    List<LanzamientoResumen> historial(long jugadorId) {
        return lanzamientos.findByJugadorIdOrderByIdDesc(jugadorId).stream()
                .map(guardado -> guardado.resumen(jsonMapper.readValue(guardado.getInforme(), InformeLanzamiento.class)))
                .toList();
    }

    private long costeDePiezas(List<String> piezaIds, int nivelJugador) {
        long total = 0;
        for (String piezaId : piezaIds) {
            PiezaCatalogo pieza = catalogo.pieza(piezaId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Part " + piezaId + " does not exist"));
            if (pieza.nivelRequerido() > nivelJugador) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        pieza.nombre() + " requires level " + pieza.nivelRequerido() + " and you are level " + nivelJugador);
            }
            total += pieza.coste();
        }
        return total;
    }

    private static boolean estaDisponible(MisionCatalogo mision, Jugador jugador) {
        if (!jugador.getPerfil().isTutorialCompletado()) {
            return mision.tipo() == TipoMision.TUTORIAL;
        }
        boolean enObservacion = jugador.getEmpresa().nivelConfianza() == NivelConfianza.EN_OBSERVACION;
        return switch (mision.tipo()) {
            case TUTORIAL -> false;
            case PRUEBA -> enObservacion;
            case SOLO -> !enObservacion && jugador.getConocimiento().getNivel() >= mision.nivelMinimo();
        };
    }

    private Jugador buscarJugador(long jugadorId) {
        return jugadores.findById(jugadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La cuenta " + jugadorId + " ya no existe"));
    }
}
