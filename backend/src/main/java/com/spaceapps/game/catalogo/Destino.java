package com.spaceapps.game.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// misionId es la misión HITO que lo alcanza; financiacion, la ronda de inversores de la primera vez.
@JsonIgnoreProperties(ignoreUnknown = true)
public record Destino(String id, String nombre, String misionId, long financiacion) {
}
