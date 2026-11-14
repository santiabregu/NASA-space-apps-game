package com.spaceapps.game.equipo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import com.spaceapps.game.amigos.AmigosService;
import com.spaceapps.game.catalogo.Catalogo;
import com.spaceapps.game.empresa.Empresa;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

import tools.jackson.databind.node.JsonNodeFactory;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:salas",
        "app.jwt.secret=secreto-de-prueba-con-al-menos-32-bytes"
})
class SalasServiceTest {

    @Autowired
    private SalasService salas;

    @Autowired
    private AmigosService amigos;

    @Autowired
    private JugadorRepository jugadores;

    @Autowired
    private Catalogo catalogo;

    private long nuevoJugador(String nombre) {
        return jugadores.save(new Jugador(nombre + "@test.dev", "hash", nombre, new Empresa(nombre + " Corp"),
                catalogo.kitInicial(), catalogo.mesLimite())).getId();
    }

    @Test
    void conElCodigoSeEntraEnLaSala() {
        long anfitrion = nuevoJugador("rosa");
        long invitado = nuevoJugador("saul");
        String codigo = salas.crear(anfitrion, "trappist-1").codigo();

        SalaResponse sala = salas.unirse(invitado, codigo.toLowerCase());

        assertThat(sala.estrella()).isEqualTo("TRAPPIST-1");
        assertThat(sala.miembros()).extracting(SalaResponse.MiembroResponse::nombreUsuario).containsExactly("rosa", "saul");
    }

    @Test
    void soloSePuedeInvitarAAmigos() {
        long anfitrion = nuevoJugador("tomas");
        long amigo = nuevoJugador("ursula");
        long desconocido = nuevoJugador("victor");
        long amistadId = amigos.solicitar(anfitrion, "ursula").enviadas().getFirst().amistadId();
        amigos.aceptar(amigo, amistadId);
        String codigo = salas.crear(anfitrion, "sol").codigo();

        salas.invitar(anfitrion, codigo, amigo);

        assertThat(salas.invitaciones(amigo)).singleElement().satisfies(invitacion -> {
            assertThat(invitacion.anfitrion()).isEqualTo("tomas");
            assertThat(invitacion.estrella()).isEqualTo("The Sun");
        });
        assertThatThrownBy(() -> salas.invitar(anfitrion, codigo, desconocido)).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void conDosJugadoresCadaUnoLlevaDosDepartamentos() {
        long anfitrion = nuevoJugador("wendy");
        long otro = nuevoJugador("xavi");
        String codigo = salas.crear(anfitrion, "betelgeuse").codigo();
        salas.unirse(otro, codigo);

        SalaResponse sala = salas.empezar(anfitrion, codigo);

        assertThat(sala.estado()).isEqualTo(Sala.Estado.EN_JUEGO);
        assertThat(sala.fase().departamento()).isEqualTo(Departamento.FINANCIACION);
        assertThat(sala.fase().empiezaEn()).isGreaterThan(sala.ahora());
        assertThat(sala.miembros()).allSatisfy(miembro -> assertThat(miembro.departamentos()).hasSize(2));
        assertThat(sala.miembros().stream().flatMap(miembro -> miembro.departamentos().stream()))
                .containsExactlyInAnyOrder(Departamento.values());
    }

    @Test
    void nadieJuegaMientrasSeLeeElReparto() {
        long anfitrion = nuevoJugador("hugo");
        long otro = nuevoJugador("irene");
        String codigo = salas.crear(anfitrion, "sol").codigo();
        salas.unirse(otro, codigo);
        SalaResponse sala = salas.empezar(anfitrion, codigo);
        long financiero = sala.miembros().stream()
                .filter(miembro -> miembro.departamentos().contains(Departamento.FINANCIACION))
                .findFirst().orElseThrow().jugadorId();

        assertThatThrownBy(() -> salas.enviarResultado(financiero, codigo, Departamento.FINANCIACION,
                JsonNodeFactory.instance.objectNode().put("monedas", 4)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("has not started");
    }

    @Test
    void soloElAnfitrionEmpiezaYNoSePuedeSolo() {
        long anfitrion = nuevoJugador("yago");
        long otro = nuevoJugador("zoe");
        String codigo = salas.crear(anfitrion, "proxima-centauri").codigo();

        assertThatThrownBy(() -> salas.empezar(anfitrion, codigo)).isInstanceOf(ResponseStatusException.class);
        salas.unirse(otro, codigo);
        assertThatThrownBy(() -> salas.empezar(otro, codigo)).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void laSalaNoAdmiteUnQuintoJugadorYAvisaSoloSiCambia() {
        long anfitrion = nuevoJugador("alba");
        String codigo = salas.crear(anfitrion, "sol").codigo();
        for (String nombre : List.of("bea", "ciro", "dora")) {
            salas.unirse(nuevoJugador(nombre), codigo);
        }
        long version = salas.ver(anfitrion, codigo, null).orElseThrow().version();

        assertThatThrownBy(() -> salas.unirse(nuevoJugador("elio"), codigo)).isInstanceOf(ResponseStatusException.class);
        assertThat(salas.ver(anfitrion, codigo, version)).isEmpty();
    }

    @Test
    void siSeVaElAnfitrionMandaElSiguiente() {
        long anfitrion = nuevoJugador("fede");
        long otro = nuevoJugador("gina");
        String codigo = salas.crear(anfitrion, "sol").codigo();
        salas.unirse(otro, codigo);

        salas.salir(anfitrion, codigo);

        assertThat(salas.mia(otro)).hasValueSatisfying(sala -> assertThat(sala.anfitrionId()).isEqualTo(otro));
        assertThat(salas.mia(anfitrion)).isEmpty();
    }
}
