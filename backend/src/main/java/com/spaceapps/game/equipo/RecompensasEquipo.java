package com.spaceapps.game.equipo;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.spaceapps.game.catalogo.Catalogo;
import com.spaceapps.game.catalogo.Destino;
import com.spaceapps.game.catalogo.ReglasEquipo;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

// Lo que se lleva cada miembro a su campaña en solitario. Las misiones de equipo no alcanzan destinos;
// solo tocan el reloj si fallan, y entonces cuestan días, no meses.
@Component
class RecompensasEquipo {

    // piezaId y destinoId van juntos (la pieza clave de ese destino); dinero, si ya no quedan destinos con pieza.
    record Recompensa(long jugadorId, String nombreUsuario, String piezaId, String destinoId, long dinero, int diasPerdidos) {
    }

    private final Catalogo catalogo;
    private final JugadorRepository jugadores;

    RecompensasEquipo(Catalogo catalogo, JugadorRepository jugadores) {
        this.catalogo = catalogo;
        this.jugadores = jugadores;
    }

    // Llamar dentro de una transacción: los cambios del jugador se guardan al confirmarla.
    Recompensa recompensar(long jugadorId, boolean exito) {
        Jugador jugador = jugadores.findById(jugadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account " + jugadorId + " no longer exists"));
        ReglasEquipo reglas = catalogo.reglasEquipo();
        if (!exito) {
            jugador.perderDias(reglas.diasPorFallo(), reglas.diasPorMes());
            return new Recompensa(jugadorId, jugador.getNombreUsuario(), null, null, 0, reglas.diasPorFallo());
        }
        Destino siguiente = siguienteDestino(jugador);
        if (siguiente == null) {
            jugador.cobrar(reglas.dineroSinPieza());
            return new Recompensa(jugadorId, jugador.getNombreUsuario(), null, null, reglas.dineroSinPieza(), 0);
        }
        jugador.anadirPiezas(List.of(siguiente.piezaClave()));
        return new Recompensa(jugadorId, jugador.getNombreUsuario(), siguiente.piezaClave(), siguiente.id(), 0, 0);
    }

    // El primer destino que aún no ha alcanzado, si todavía se puede jugar y tiene pieza clave.
    private Destino siguienteDestino(Jugador jugador) {
        return catalogo.destinos().stream()
                .filter(destino -> !jugador.haAlcanzado(destino.id()))
                .findFirst()
                .filter(destino -> !destino.esProximamente() && destino.piezaClave() != null)
                .orElse(null);
    }
}
