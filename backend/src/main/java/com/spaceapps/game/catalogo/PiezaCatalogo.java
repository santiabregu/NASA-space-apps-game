package com.spaceapps.game.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// destinoRequerido es null en las piezas del kit inicial: se pueden comprar desde el principio.
@JsonIgnoreProperties(ignoreUnknown = true)
public record PiezaCatalogo(String id, String nombre, long coste, String destinoRequerido) {
}
