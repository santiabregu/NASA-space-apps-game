package com.spaceapps.game.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MisionCatalogo(String id, String titulo, TipoMision tipo, int nivelMinimo, Recompensa recompensa) {

    public record Recompensa(long dinero, int xp) {
    }
}
