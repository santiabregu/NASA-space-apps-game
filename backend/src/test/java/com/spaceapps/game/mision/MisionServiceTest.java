package com.spaceapps.game.mision;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.spaceapps.game.empresa.Empresa;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:test",
        "app.jwt.secret=secreto-de-prueba-con-al-menos-32-bytes"
})
class MisionServiceTest {

    private static final List<String> PIEZAS_TUTORIAL = List.of("estructura-3u", "panel-desplegable", "bateria-pequena",
            "ordenador-basico", "antena-uhf", "motor-rayo", "tanque-mediano", "motor-chispa", "tanque-pequeno", "cofia-pequena");

    @Autowired
    private MisionService misionService;

    @Autowired
    private JugadorRepository jugadores;

    @Test
    void elLanzamientoQuedaEnElHistorialConSuInforme() {
        Jugador jugador = jugadores.save(new Jugador("historial@test.dev", "hash", "historial", new Empresa("Orbital")));
        InformeLanzamiento informe = new InformeLanzamiento("leo-400",
                List.of(new InformeLanzamiento.Evento("Liftoff", "despegue", true)),
                List.of("Balanced design."),
                List.of(new InformeLanzamiento.Valoracion(true, "Reach orbit", "1,428 m/s of margin.")),
                Map.of("objetivo", 50));

        misionService.lanzar(jugador.getId(), "tutorial", new LanzamientoRequest(PIEZAS_TUTORIAL, true, 100, false, informe));

        List<LanzamientoResumen> historial = misionService.historial(jugador.getId());
        assertThat(historial).singleElement().satisfies(lanzamiento -> {
            assertThat(lanzamiento.misionId()).isEqualTo("tutorial");
            assertThat(lanzamiento.puntuacion()).isEqualTo(100);
            assertThat(lanzamiento.costePagado()).isEqualTo(6_800_000);
            assertThat(lanzamiento.dineroGanado()).isEqualTo(12_000_000);
            assertThat(lanzamiento.piezas()).isEqualTo(PIEZAS_TUTORIAL);
            assertThat(lanzamiento.informe()).isEqualTo(informe);
        });
        assertThat(jugadores.findById(jugador.getId()).orElseThrow().getMejorPuntuacionPorMision()).containsEntry("tutorial", 100);
    }
}
