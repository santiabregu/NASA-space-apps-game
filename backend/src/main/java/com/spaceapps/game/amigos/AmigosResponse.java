package com.spaceapps.game.amigos;

import java.util.List;

// amistadId sirve para aceptar, rechazar, cancelar o borrar la relación.
public record AmigosResponse(List<Contacto> amigos, List<Contacto> recibidas, List<Contacto> enviadas) {

    public record Contacto(long amistadId, PerfilPublico jugador) {
    }
}
