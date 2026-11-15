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

    private static Jugador llegaALaLunaEnElMes(int mes, int misionesConAmigos) {
        Jugador jugador = conKit(Map.of());
        for (int i = 0; i < misionesConAmigos; i++) {
            jugador.registrarMisionConAmigos();
        }
        jugador.avanzarReloj(mes);
        jugador.alcanzarDestino("luna");
        jugador.comprobarFinal("luna", 3);
        return jugador;
    }

    @Test
    void elFinalDependeDeLlegarATiempoYDeLasMisionesConAmigos() {
        assertThat(llegaALaLunaEnElMes(12, 3).getFinalCampana()).isEqualTo(FinalCampana.NEW_HOME);
        assertThat(llegaALaLunaEnElMes(9, 2).getFinalCampana()).isEqualTo(FinalCampana.LONE_PIONEER);
        assertThat(llegaALaLunaEnElMes(13, 4).getFinalCampana()).isEqualTo(FinalCampana.RELAY);
        assertThat(llegaALaLunaEnElMes(13, 0).getFinalCampana()).isEqualTo(FinalCampana.LAST_SIGNAL);
    }

    @Test
    void sinLlegarAlUltimoDestinoElFinalLlegaAlAgotarseElReloj() {
        Jugador jugador = conKit(Map.of());
        jugador.avanzarReloj(11);
        jugador.comprobarFinal("luna", 3);
        assertThat(jugador.getFinalCampana()).isNull();

        jugador.avanzarReloj(1);
        jugador.comprobarFinal("luna", 3);
        assertThat(jugador.getFinalCampana()).isEqualTo(FinalCampana.LAST_SIGNAL);
    }

    @Test
    void elFinalNoCambiaUnaVezDecidido() {
        Jugador jugador = llegaALaLunaEnElMes(13, 0);
        for (int i = 0; i < 3; i++) {
            jugador.registrarMisionConAmigos();
        }

        jugador.comprobarFinal("luna", 3);

        assertThat(jugador.getFinalCampana()).isEqualTo(FinalCampana.LAST_SIGNAL);
    }

    @Test
    void noSePuedeVerUnFinalQueNoExiste() {
        Jugador jugador = conKit(Map.of());

        assertThatThrownBy(jugador::marcarFinalVisto).isInstanceOf(IllegalStateException.class);
    }
}
