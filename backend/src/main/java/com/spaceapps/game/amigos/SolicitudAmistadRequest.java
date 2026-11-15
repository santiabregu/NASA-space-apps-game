package com.spaceapps.game.amigos;

// Por id y no por nombre: dos jugadores pueden llamarse igual si su empresa es distinta.
record SolicitudAmistadRequest(long jugadorId) {
}
