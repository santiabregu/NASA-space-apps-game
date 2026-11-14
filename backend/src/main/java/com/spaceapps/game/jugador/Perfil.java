package com.spaceapps.game.jugador;

import jakarta.persistence.Embeddable;

@Embeddable
public class Perfil {

    private int misionesCompletadas;
    private int misionesFallidas;
    private boolean tutorialCompletado;

    public int getMisionesCompletadas() {
        return misionesCompletadas;
    }

    public int getMisionesFallidas() {
        return misionesFallidas;
    }

    public boolean isTutorialCompletado() {
        return tutorialCompletado;
    }
}
