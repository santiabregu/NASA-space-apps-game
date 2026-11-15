package com.spaceapps.game.equipo;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.spaceapps.game.catalogo.Catalogo;
import com.spaceapps.game.catalogo.Destino;
import com.spaceapps.game.empresa.Empresa;
import com.spaceapps.game.jugador.FinalCampana;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:salas",
        "app.jwt.secret=secreto-de-prueba-con-al-menos-32-bytes"
})
@Transactional
class RecompensasEquipoTest {

    @Autowired
    private RecompensasEquipo recompensas;

    @Autowired
    private JugadorRepository jugadores;

    @Autowired
    private Catalogo catalogo;

    private Jugador nuevoJugador(String nombre) {
        return jugadores.save(new Jugador(nombre, new Empresa(nombre + " Corp"),
                catalogo.kitInicial(), catalogo.mesLimite()));
    }

    @Test
    void conExitoCadaUnoGanaLaPiezaClaveDeSuSiguienteDestino() {
        Jugador novato = nuevoJugador("hector");
        Jugador veterano = nuevoJugador("ines");
        veterano.alcanzarDestino("mar");
        veterano.alcanzarDestino("espacio");
        int tanquesAntes = novato.getInventario().getOrDefault("tanque-sonda", 0);

        RecompensasEquipo.Recompensa delNovato = recompensas.recompensar(novato.getId(), true, false);
        RecompensasEquipo.Recompensa delVeterano = recompensas.recompensar(veterano.getId(), true, false);

        assertThat(delNovato.piezaId()).isEqualTo("tanque-sonda");
        assertThat(novato.getInventario().get("tanque-sonda")).isEqualTo(tanquesAntes + 1);
        assertThat(delVeterano.destinoId()).isEqualTo("orbita-baja");
        assertThat(veterano.getInventario()).containsEntry("motor-rayo", 1);
    }

    @Test
    void quienYaNoTieneDestinoConPiezaCobraDinero() {
        Jugador lunar = nuevoJugador("julia");
        catalogo.destinos().stream().filter(destino -> !destino.esProximamente()).map(Destino::id).forEach(lunar::alcanzarDestino);
        long dineroAntes = lunar.getDinero();

        RecompensasEquipo.Recompensa recompensa = recompensas.recompensar(lunar.getId(), true, false);

        assertThat(recompensa.piezaId()).isNull();
        assertThat(lunar.getDinero()).isEqualTo(dineroAntes + catalogo.reglasEquipo().dineroSinPieza());
    }

    @Test
    void alFallarNoHayPiezaYSePierdenDias() {
        Jugador jugador = nuevoJugador("kevin");

        RecompensasEquipo.Recompensa recompensa = recompensas.recompensar(jugador.getId(), false, true);

        assertThat(recompensa.piezaId()).isNull();
        assertThat(recompensa.diasPerdidos()).isEqualTo(catalogo.reglasEquipo().diasPorFallo());
        assertThat(jugador.getDiasPerdidos()).isEqualTo(catalogo.reglasEquipo().diasPorFallo());
        assertThat(jugador.getMesActual()).isZero();
        assertThat(jugador.getMisionesConAmigos()).isZero();
    }

    @Test
    void soloCuentanParaElFinalLasVictoriasConAmigos() {
        Jugador jugador = nuevoJugador("lucia");

        recompensas.recompensar(jugador.getId(), true, true);
        recompensas.recompensar(jugador.getId(), true, false);

        assertThat(jugador.getMisionesConAmigos()).isEqualTo(1);
    }

    @Test
    void siUnFalloAgotaElRelojLlegaElFinal() {
        Jugador jugador = nuevoJugador("mario");
        jugador.avanzarReloj(catalogo.mesLimite() - 1);
        jugador.perderDias(catalogo.reglasEquipo().diasPorMes() - catalogo.reglasEquipo().diasPorFallo(),
                catalogo.reglasEquipo().diasPorMes());

        recompensas.recompensar(jugador.getId(), false, true);

        assertThat(jugador.getMesActual()).isEqualTo(catalogo.mesLimite());
        assertThat(jugador.getFinalCampana()).isEqualTo(FinalCampana.LAST_SIGNAL);
    }
}
