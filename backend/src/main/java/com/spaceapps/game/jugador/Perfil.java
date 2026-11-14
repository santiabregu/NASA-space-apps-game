package com.spaceapps.game.jugador;

import jakarta.persistence.Embeddable;

@Embeddable
public class Perfil {

    private int misionesCompletadas;
    private int misionesFallidas;

    public int getMisionesCompletadas() {
        return misionesCompletadas;
    }

    public int getMisionesFallidas() {
        return misionesFallidas;
    }

    public void registrarExito() {
        misionesCompletadas++;
    }

    public void registrarFallo() {
        misionesFallidas++;
    }
}
