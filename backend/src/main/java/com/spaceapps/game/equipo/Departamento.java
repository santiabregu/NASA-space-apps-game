package com.spaceapps.game.equipo;

import java.time.Duration;

// Los departamentos juegan siempre en este orden: el dinero decide qué se puede comprar,
// el software hace funcionar el satélite y el cohete se diseña para el satélite que hay.
// En las fases de construcción los demás votan piezas.
public enum Departamento {
    FINANCIACION(Duration.ofSeconds(90), false),
    SOFTWARE(Duration.ofSeconds(90), false),
    SATELITE(Duration.ofSeconds(150), true),
    COHETE(Duration.ofSeconds(150), true);

    private final Duration duracion;
    private final boolean construccion;

    Departamento(Duration duracion, boolean construccion) {
        this.duracion = duracion;
        this.construccion = construccion;
    }

    Duration duracion() {
        return duracion;
    }

    boolean construccion() {
        return construccion;
    }
}
