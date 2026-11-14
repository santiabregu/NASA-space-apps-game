package com.spaceapps.game.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// Objetivo de las misiones de equipo: un telescopio o una sonda que estudia esta estrella.
@JsonIgnoreProperties(ignoreUnknown = true)
public record Estrella(String id, String nombre, Mision mision) {

    // El resto de la misión (órbita, piezas obligatorias, requisitos) solo lo usa el motor del navegador.
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Mision(long presupuestoBase) {
    }
}
