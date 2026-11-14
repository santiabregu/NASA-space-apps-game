package com.spaceapps.game.mision;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.spaceapps.game.catalogo.Catalogo;
import com.spaceapps.game.empresa.Empresa;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:test",
        "app.jwt.secret=secreto-de-prueba-con-al-menos-32-bytes"
})
class MisionServiceTest {

    private static final List<String> KIT = List.of("motor-sonda", "tanque-sonda", "cofia-cono");
    private static final InformeLanzamiento INFORME = new InformeLanzamiento(null,
            List.of(new InformeLanzamiento.Evento("Liftoff", "despegue", true)),
            List.of("Balanced design."),
            List.of(new InformeLanzamiento.Valoracion(true, "Reach altitude", "60 km of 10 km.")),
            Map.of("objetivo", 50));

    @Autowired
    private MisionService misionService;

    @Autowired
    private JugadorRepository jugadores;

    @Autowired
    private Catalogo catalogo;

    private Jugador nuevoJugador(String nombre) {
        return jugadores.save(new Jugador(nombre + "@test.dev", "hash", nombre, new Empresa(nombre),
                catalogo.kitInicial(), catalogo.mesLimite()));
    }

    private LanzamientoResponse lanzar(Jugador jugador, String misionId, List<String> piezas, boolean exito) {
        return misionService.lanzar(jugador.getId(), misionId, new LanzamientoRequest(piezas, exito, exito ? 100 : 0, true, INFORME));
    }

    @Test
    void alPrincipioSoloEstaElPrimerVuelo() {
        assertThat(misionService.disponibles(nuevoJugador("novato").getId())).containsExactly("primer-vuelo");
    }

    @Test
    void elPrimerVueloConElKitAlcanzaElMarYTraeFinanciacion() {
        Jugador jugador = nuevoJugador("marino");

        LanzamientoResponse respuesta = lanzar(jugador, "primer-vuelo", KIT, true);

        assertThat(respuesta.costePagado()).isZero();
        assertThat(respuesta.destinoAlcanzado()).isEqualTo("mar");
        assertThat(respuesta.financiacion()).isEqualTo(2_000_000);
        assertThat(respuesta.mesJuego()).isEqualTo(1);
        assertThat(respuesta.jugador().dinero()).isEqualTo(2_500_000);
        assertThat(respuesta.jugador().inventario()).isEmpty();
        assertThat(respuesta.jugador().campana().destinosAlcanzados()).isEqualTo(Map.of("mar", 1));
        assertThat(misionService.disponibles(jugador.getId())).contains("primer-vuelo", "linea-karman");
        assertThat(misionService.historial(jugador.getId())).singleElement().satisfies(lanzamiento -> {
            assertThat(lanzamiento.misionId()).isEqualTo("primer-vuelo");
            assertThat(lanzamiento.destinoAlcanzado()).isEqualTo("mar");
            assertThat(lanzamiento.piezas()).isEqualTo(KIT);
            assertThat(lanzamiento.informe()).isEqualTo(INFORME);
        });
    }

    @Test
    void repetirUnHitoNoVuelveAFinanciar() {
        Jugador jugador = nuevoJugador("repetidor");
        lanzar(jugador, "primer-vuelo", KIT, true);

        LanzamientoResponse segunda = lanzar(jugador, "primer-vuelo", KIT, true);

        assertThat(segunda.destinoAlcanzado()).isNull();
        assertThat(segunda.financiacion()).isZero();
        assertThat(segunda.costePagado()).isEqualTo(250_000);
        assertThat(segunda.mesJuego()).isEqualTo(2);
    }

    @Test
    void lasPiezasQueFaltanSeCompranConPrestamoSiNoHayDinero() {
        Jugador jugador = nuevoJugador("fallon");

        LanzamientoResponse fallo = lanzar(jugador, "primer-vuelo", KIT, false);
        LanzamientoResponse reintento = lanzar(jugador, "primer-vuelo", KIT, true);

        assertThat(fallo.destinoAlcanzado()).isNull();
        assertThat(reintento.costePagado()).isEqualTo(250_000);
        assertThat(reintento.prestamo()).isEqualTo(250_000);
        assertThat(reintento.deudaDevuelta()).isEqualTo(250_000);
        assertThat(reintento.jugador().empresa().deuda()).isZero();
    }

    @Test
    void noSePuedenComprarPiezasDeUnDestinoSinAlcanzar() {
        Jugador jugador = nuevoJugador("prisas");

        assertThatThrownBy(() -> lanzar(jugador, "primer-vuelo", List.of("motor-chispa", "tanque-sonda", "cofia-cono"), true))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        excepcion -> assertThat(excepcion.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }
}
