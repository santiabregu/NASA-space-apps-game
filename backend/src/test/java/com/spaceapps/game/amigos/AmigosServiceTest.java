package com.spaceapps.game.amigos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.groups.Tuple.tuple;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import com.spaceapps.game.amigos.ResultadoBusqueda.Relacion;
import com.spaceapps.game.catalogo.Catalogo;
import com.spaceapps.game.empresa.Empresa;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:amigos",
        "app.jwt.secret=secreto-de-prueba-con-al-menos-32-bytes"
})
class AmigosServiceTest {

    @Autowired
    private AmigosService amigos;

    @Autowired
    private JugadorRepository jugadores;

    @Autowired
    private Catalogo catalogo;

    private Jugador nuevoJugador(String nombre) {
        return jugadores.save(new Jugador(nombre, new Empresa(nombre + " Corp"),
                catalogo.kitInicial(), catalogo.mesLimite()));
    }

    @Test
    void unaSolicitudAceptadaLosHaceAmigos() {
        Jugador ana = nuevoJugador("ana");
        Jugador bruno = nuevoJugador("bruno");

        AmigosResponse deAna = amigos.solicitar(ana.getId(), bruno.getId());
        assertThat(deAna.enviadas()).singleElement().satisfies(c -> assertThat(c.jugador().nombreUsuario()).isEqualTo("bruno"));

        long amistadId = amigos.resumen(bruno.getId()).recibidas().getFirst().amistadId();
        AmigosResponse deBruno = amigos.aceptar(bruno.getId(), amistadId);

        assertThat(deBruno.amigos()).singleElement().satisfies(c -> assertThat(c.jugador().empresa()).isEqualTo("ana Corp"));
        assertThat(amigos.sonAmigos(ana.getId(), bruno.getId())).isTrue();
    }

    @Test
    void siLosDosSePidenAmistadSeAceptaSola() {
        Jugador carla = nuevoJugador("carla");
        Jugador dani = nuevoJugador("dani");
        amigos.solicitar(carla.getId(), dani.getId());

        AmigosResponse deDani = amigos.solicitar(dani.getId(), carla.getId());

        assertThat(deDani.amigos()).hasSize(1);
        assertThat(deDani.recibidas()).isEmpty();
    }

    @Test
    void nadiePuedeAceptarSuPropiaSolicitud() {
        Jugador eva = nuevoJugador("eva");
        Jugador fran = nuevoJugador("fran");
        long amistadId = amigos.solicitar(eva.getId(), fran.getId()).enviadas().getFirst().amistadId();

        assertThatThrownBy(() -> amigos.aceptar(eva.getId(), amistadId)).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void laBusquedaExcluyeAUnoMismoYDiceLaRelacion() {
        Jugador gael = nuevoJugador("gael");
        Jugador gaela = nuevoJugador("gaela");
        nuevoJugador("gaelo");
        amigos.solicitar(gael.getId(), gaela.getId());

        assertThat(amigos.buscar(gael.getId(), "gae"))
                .extracting(r -> r.jugador().nombreUsuario(), ResultadoBusqueda::relacion)
                .containsExactly(
                        tuple("gaela", Relacion.ENVIADA),
                        tuple("gaelo", Relacion.NINGUNA));
    }

    @Test
    void borrarUnaAmistadLaQuitaParaLosDos() {
        Jugador hugo = nuevoJugador("hugo");
        Jugador ines = nuevoJugador("ines");
        long amistadId = amigos.solicitar(hugo.getId(), ines.getId()).enviadas().getFirst().amistadId();
        amigos.aceptar(ines.getId(), amistadId);

        amigos.eliminar(ines.getId(), amistadId);

        assertThat(amigos.resumen(hugo.getId()).amigos()).isEmpty();
        assertThat(amigos.sonAmigos(hugo.getId(), ines.getId())).isFalse();
    }
}
