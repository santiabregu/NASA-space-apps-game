package com.spaceapps.game.mision;

import com.spaceapps.game.jugador.JugadorResponse;

public record LanzamientoResponse(
        long costePagado,
        long prestamo,
        long dineroGanado,
        long deudaDevuelta,
        int xpGanada,
        int cambioReputacion,
        int nivelesSubidos,
        String destinoAlcanzado,
        long financiacion,
        int mesJuego,
        JugadorResponse jugador) {
}
