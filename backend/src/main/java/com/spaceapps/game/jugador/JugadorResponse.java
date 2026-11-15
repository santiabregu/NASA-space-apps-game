package com.spaceapps.game.jugador;

import java.util.Map;

import com.spaceapps.game.empresa.EmpresaResponse;

public record JugadorResponse(
        Long id,
        String nombreUsuario,
        long dinero,
        int nivel,
        int xp,
        int xpSiguienteNivel,
        int misionesCompletadas,
        int misionesFallidas,
        Map<String, Integer> misionesTerminadas,
        Campana campana,
        Map<String, Integer> inventario,
        EmpresaResponse empresa) {

    // destinosAlcanzados: id del destino → mes de juego en que se alcanzó. diasPerdidos: lo que aún no llega a un mes.
    // finalCampana es null mientras la campaña sigue en juego.
    public record Campana(boolean introVista, int mesActual, int diasPerdidos, int mesLimite, Map<String, Integer> destinosAlcanzados,
            int misionesConAmigos, FinalCampana finalCampana, boolean finalVisto) {
    }

    public static JugadorResponse de(Jugador jugador) {
        Conocimiento conocimiento = jugador.getConocimiento();
        Perfil perfil = jugador.getPerfil();
        return new JugadorResponse(
                jugador.getId(),
                jugador.getNombreUsuario(),
                jugador.getDinero(),
                conocimiento.getNivel(),
                conocimiento.getXp(),
                conocimiento.xpParaSiguienteNivel(),
                perfil.getMisionesCompletadas(),
                perfil.getMisionesFallidas(),
                jugador.getMejorPuntuacionPorMision(),
                new Campana(jugador.isIntroVista(), jugador.getMesActual(), jugador.getDiasPerdidos(), jugador.getMesLimite(),
                        jugador.getMesPorDestinoAlcanzado(), jugador.getMisionesConAmigos(), jugador.getFinalCampana(),
                        jugador.isFinalVisto()),
                jugador.getInventario(),
                EmpresaResponse.de(jugador.getEmpresa()));
    }
}
