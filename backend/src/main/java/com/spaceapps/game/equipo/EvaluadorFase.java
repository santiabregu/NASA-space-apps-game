package com.spaceapps.game.equipo;

import java.util.Map;

import tools.jackson.databind.JsonNode;

// Convierte lo que manda el navegador en el resultado oficial de una fase.
// Si la fase caducó, datos es el último progreso (o null) y no debe fallar por datos incompletos.
@FunctionalInterface
interface EvaluadorFase {

    JsonNode evaluar(Departamento departamento, JsonNode datos, boolean caducado, Map<Departamento, Sala.Resultado> anteriores);
}
