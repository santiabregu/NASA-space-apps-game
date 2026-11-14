package com.spaceapps.game.equipo;

import java.util.List;
import java.util.Map;

import tools.jackson.databind.JsonNode;

// invitados son ids de jugadores: el anfitrión ve a quién ha invitado ya.
// Los instantes van en milisegundos desde 1970; con "ahora" el navegador corrige la diferencia
// entre su reloj y el del servidor y todos ven la misma cuenta atrás.
public record SalaResponse(
        String codigo,
        String estrellaId,
        String estrella,
        Sala.Estado estado,
        long anfitrionId,
        List<MiembroResponse> miembros,
        List<Long> invitados,
        FaseResponse fase,
        Map<Departamento, Sala.Resultado> resultados,
        Sala.Lanzamiento lanzamiento,
        long ahora,
        long version) {

    public record MiembroResponse(long jugadorId, String nombreUsuario, String empresa, List<Departamento> departamentos) {
    }

    // Solo existe mientras la sala está EN_JUEGO. votos: las piezas que propone cada compañero, por jugadorId.
    public record FaseResponse(Departamento departamento, long empiezaEn, long terminaEn, JsonNode progreso,
            Map<Long, List<String>> votos) {
    }

    public record InvitacionResponse(String codigo, String estrella, String anfitrion, int miembros) {
    }
}
