package com.spaceapps.game.amigos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record SolicitudAmistadRequest(@NotBlank @Size(max = 30) String nombreUsuario) {
}
