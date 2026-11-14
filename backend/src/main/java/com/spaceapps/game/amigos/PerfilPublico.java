package com.spaceapps.game.amigos;

import com.spaceapps.game.jugador.Jugador;

// Lo que un jugador puede ver de otro: nunca el email.
public record PerfilPublico(long id, String nombreUsuario, String empresa, int nivel, int destinosAlcanzados) {

    static PerfilPublico de(Jugador jugador) {
        return new PerfilPublico(jugador.getId(), jugador.getNombreUsuario(), jugador.getEmpresa().getNombre(),
                jugador.getConocimiento().getNivel(), jugador.getMesPorDestinoAlcanzado().size());
    }
}
