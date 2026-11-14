package com.spaceapps.game.mision;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LanzamientoRequest(
        @NotEmpty @Size(max = 60) List<@NotBlank String> piezas,
        boolean exito,
        @Min(0) @Max(100) int puntuacion,
        boolean aceptaPrestamo,
        @NotNull @Valid InformeLanzamiento informe) {
}
