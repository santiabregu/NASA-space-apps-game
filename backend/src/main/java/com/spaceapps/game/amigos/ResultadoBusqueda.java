package com.spaceapps.game.amigos;

public record ResultadoBusqueda(PerfilPublico jugador, Relacion relacion) {

    public enum Relacion {
        NINGUNA,
        AMIGO,
        ENVIADA,
        RECIBIDA
    }
}
