package com.spaceapps.game.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// misionId es la misión HITO que lo alcanza; financiacion, la ronda de inversores de la primera vez.
// piezaClave es lo que gana en una misión de equipo quien tiene este destino como siguiente objetivo.
@JsonIgnoreProperties(ignoreUnknown = true)
public record Destino(String id, int orden, String nombre, String misionId, long financiacion, String piezaClave,
        Boolean proximamente) {

    // En el catálogo solo lo llevan los destinos que aún no se pueden jugar.
    public boolean esProximamente() {
        return Boolean.TRUE.equals(proximamente);
    }
}
