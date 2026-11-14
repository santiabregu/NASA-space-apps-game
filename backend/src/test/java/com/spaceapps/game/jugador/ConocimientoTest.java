package com.spaceapps.game.jugador;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ConocimientoTest {

    @Test
    void subeVariosNivelesYConservaLaXpSobrante() {
        Conocimiento conocimiento = new Conocimiento();

        int nivelesSubidos = conocimiento.ganarXp(350);

        assertThat(nivelesSubidos).isEqualTo(2);
        assertThat(conocimiento.getNivel()).isEqualTo(3);
        assertThat(conocimiento.getXp()).isEqualTo(50);
    }
}
