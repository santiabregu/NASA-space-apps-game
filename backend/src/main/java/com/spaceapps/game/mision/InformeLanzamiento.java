package com.spaceapps.game.mision;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Lo genera la simulación del cliente; el servidor solo lo guarda para el historial, nunca decide nada con él.
// orbitaId es null en los vuelos suborbitales.
public record InformeLanzamiento(
        @Size(max = 40) String orbitaId,
        @NotNull @Size(max = 20) List<@Valid Evento> eventos,
        @NotNull @Size(max = 20) List<@NotBlank @Size(max = 600) String> explicaciones,
        @NotNull @Size(max = 20) List<@Valid Valoracion> valoracion,
        @Size(max = 10) Map<@Size(max = 20) String, @Min(-100) @Max(100) Integer> desglose) {

    public record Evento(@NotBlank @Size(max = 200) String texto, @Size(max = 20) String icono, boolean ok) {
    }

    public record Valoracion(boolean ok, @NotBlank @Size(max = 60) String aspecto, @NotBlank @Size(max = 600) String texto) {
    }
}
