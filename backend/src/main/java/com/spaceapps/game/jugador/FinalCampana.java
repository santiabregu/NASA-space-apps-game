package com.spaceapps.game.jugador;

// Los cuatro finales salen de dos preguntas: si llegó al último destino a tiempo y si lo hizo con amigos.
public enum FinalCampana {
    NEW_HOME,
    LONE_PIONEER,
    RELAY,
    LAST_SIGNAL;

    static FinalCampana de(boolean aTiempo, boolean conAmigos) {
        if (aTiempo) {
            return conAmigos ? NEW_HOME : LONE_PIONEER;
        }
        return conAmigos ? RELAY : LAST_SIGNAL;
    }
}
