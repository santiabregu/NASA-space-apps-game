package com.spaceapps.game.jugador;

import jakarta.persistence.Embeddable;

@Embeddable
public class Conocimiento {

    private static final int XP_POR_NIVEL = 100;

    private int xp;
    private int nivel = 1;

    public int getXp() {
        return xp;
    }

    public int getNivel() {
        return nivel;
    }

    public int xpParaSiguienteNivel() {
        return XP_POR_NIVEL * nivel;
    }
}
