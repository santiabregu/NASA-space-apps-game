package com.spaceapps.game.jugador;

import com.spaceapps.game.empresa.EmpresaResponse;

public record JugadorResponse(
        Long id,
        String email,
        String nombreUsuario,
        long dinero,
        int nivel,
        int xp,
        int xpSiguienteNivel,
        int misionesCompletadas,
        int misionesFallidas,
        boolean tutorialCompletado,
        EmpresaResponse empresa) {

    static JugadorResponse de(Jugador jugador) {
        Conocimiento conocimiento = jugador.getConocimiento();
        Perfil perfil = jugador.getPerfil();
        return new JugadorResponse(
                jugador.getId(),
                jugador.getEmail(),
                jugador.getNombreUsuario(),
                jugador.getDinero(),
                conocimiento.getNivel(),
                conocimiento.getXp(),
                conocimiento.xpParaSiguienteNivel(),
                perfil.getMisionesCompletadas(),
                perfil.getMisionesFallidas(),
                perfil.isTutorialCompletado(),
                EmpresaResponse.de(jugador.getEmpresa()));
    }
}
