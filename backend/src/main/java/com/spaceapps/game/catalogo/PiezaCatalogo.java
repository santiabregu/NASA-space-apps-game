package com.spaceapps.game.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PiezaCatalogo(String id, String nombre, long coste, int nivelRequerido) {
}
