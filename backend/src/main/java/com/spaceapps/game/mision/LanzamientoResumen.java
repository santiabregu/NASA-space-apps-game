package com.spaceapps.game.mision;

import java.time.Instant;
import java.util.List;

public record LanzamientoResumen(
        Long id,
        String misionId,
        Instant fecha,
        boolean exito,
        int puntuacion,
        long costePagado,
        long prestamo,
        long dineroGanado,
        long deudaDevuelta,
        int xpGanada,
        int cambioReputacion,
        List<String> piezas,
        InformeLanzamiento informe) {
}
