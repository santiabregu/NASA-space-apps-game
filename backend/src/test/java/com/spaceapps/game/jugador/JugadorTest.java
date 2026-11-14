package com.spaceapps.game.jugador;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.spaceapps.game.catalogo.KitInicial;
import com.spaceapps.game.empresa.Empresa;

class JugadorTest {

    private static Jugador conKit(Map<String, Integer> piezas) {
        return new Jugador("a@b.dev", "hash", "piloto", new Empresa("Orbital"), new KitInicial(0, piezas), 12);
    }

    @Test
    void losDiasPerdidosSeConviertenEnMesesAlCompletarUno() {
        Jugador jugador = conKit(Map.of());

        jugador.perderDias(20, 30);
        jugador.perderDias(15, 30);

        assertThat(jugador.getMesActual()).isEqualTo(1);
        assertThat(jugador.getDiasPerdidos()).isEqualTo(5);
    }

    @Test
    void guardaLaMejorPuntuacionDeCadaMision() {
        Jugador jugador = conKit(Map.of());

        jugador.registrarMisionTerminada("cultivos", 93);
        jugador.registrarMisionTerminada("cultivos", 70);
        jugador.registrarMisionTerminada("tutorial", 100);

        assertThat(jugador.getMejorPuntuacionPorMision()).isEqualTo(Map.of("cultivos", 93, "tutorial", 100));
    }

    @Test
    void lasPiezasQueFaltanCuentanLasRepetidas() {
        Jugador jugador = conKit(Map.of("motor-sonda", 1, "tanque-sonda", 2));

        assertThat(jugador.piezasQueFaltan(List.of("motor-sonda", "motor-sonda", "tanque-sonda", "cofia-cono")))
                .containsExactly("motor-sonda", "cofia-cono");
    }

    @Test
    void consumirPiezasLasQuitaDelInventario() {
        Jugador jugador = conKit(Map.of("motor-sonda", 1, "tanque-sonda", 2));

        jugador.consumirPiezas(List.of("motor-sonda", "tanque-sonda"));

        assertThat(jugador.getInventario()).isEqualTo(Map.of("tanque-sonda", 1));
    }

    @Test
    void noSePuedenConsumirPiezasQueNoEstan() {
        Jugador jugador = conKit(Map.of("motor-sonda", 1));

        assertThatThrownBy(() -> jugador.consumirPiezas(List.of("motor-sonda", "motor-sonda")))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void unDestinoSoloSeAlcanzaPorPrimeraVezUnaVez() {
        Jugador jugador = conKit(Map.of());
        jugador.avanzarReloj(3);

        assertThat(jugador.alcanzarDestino("mar")).isTrue();
        jugador.avanzarReloj(1);
        assertThat(jugador.alcanzarDestino("mar")).isFalse();
        assertThat(jugador.getMesPorDestinoAlcanzado()).isEqualTo(Map.of("mar", 3));
        assertThat(jugador.haAlcanzado(null)).isTrue();
    }
}
