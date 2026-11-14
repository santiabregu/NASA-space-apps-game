package com.spaceapps.game.jugador;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.spaceapps.game.empresa.Empresa;

class JugadorTest {

    @Test
    void guardaLaMejorPuntuacionDeCadaMision() {
        Jugador jugador = new Jugador("a@b.dev", "hash", "piloto", new Empresa("Orbital"));

        jugador.registrarMisionTerminada("cultivos", 93);
        jugador.registrarMisionTerminada("cultivos", 70);
        jugador.registrarMisionTerminada("tutorial", 100);

        assertThat(jugador.getMejorPuntuacionPorMision()).isEqualTo(Map.of("cultivos", 93, "tutorial", 100));
    }
}
