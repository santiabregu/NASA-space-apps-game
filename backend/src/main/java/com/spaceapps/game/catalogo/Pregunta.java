package com.spaceapps.game.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// Pregunta flash de las misiones de equipo; departamento es el nombre del enum Departamento.
@JsonIgnoreProperties(ignoreUnknown = true)
public record Pregunta(String id, String departamento, int correcta) {
}
