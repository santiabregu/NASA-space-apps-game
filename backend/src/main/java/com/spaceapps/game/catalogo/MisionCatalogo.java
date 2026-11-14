package com.spaceapps.game.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// destinoId es el destino que hay que haber alcanzado para jugarla; null en la primera misión.
@JsonIgnoreProperties(ignoreUnknown = true)
public record MisionCatalogo(String id, String titulo, TipoMision tipo, String destinoId, int mesesConsumidos,
        Recompensa recompensa) {

    public record Recompensa(long dinero, int xp) {
    }
}
