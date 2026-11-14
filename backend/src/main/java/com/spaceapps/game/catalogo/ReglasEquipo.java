package com.spaceapps.game.catalogo;

// Puntuación de los minijuegos de equipo. Están en el catálogo porque el navegador calcula lo mismo para enseñarlo al momento.
public record ReglasEquipo(
        long valorMoneda,
        long valorGrant,
        int maximoMonedas,
        int maximoGrants,
        double bonusPorAcierto,
        int preguntasPorFase,
        int puntosCables,
        int conexionesCables,
        int penalizacionChispa,
        int puntosPorAcierto,
        int fiabilidadMinima,
        int maximoVotos,
        int diasPorFallo,
        int diasPorMes,
        long dineroSinPieza) {
}
