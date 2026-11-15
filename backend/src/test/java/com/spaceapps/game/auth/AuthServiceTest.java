package com.spaceapps.game.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import com.spaceapps.game.jugador.JugadorRepository;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth",
        "app.jwt.secret=secreto-de-prueba-con-al-menos-32-bytes"
})
class AuthServiceTest {

    @Autowired
    private AuthService auth;

    @Autowired
    private JwtDecoder decodificador;

    @Autowired
    private JugadorRepository jugadores;

    private long entrar(String nombre, String empresa) {
        return Long.parseLong(decodificador.decode(auth.entrar(new EntradaRequest(nombre, empresa))).getSubject());
    }

    @Test
    void conElMismoNombreYEmpresaSeContinuaLaPartida() {
        long primera = entrar("Lucia", "Orbital Corp");

        long segunda = entrar("  lucia ", "ORBITAL   corp");

        assertThat(segunda).isEqualTo(primera);
        assertThat(jugadores.findById(primera).orElseThrow().getEmpresa().getNombre()).isEqualTo("Orbital Corp");
    }

    @Test
    void elMismoNombreEnOtraEmpresaEsOtraPartida() {
        long deUna = entrar("Marco", "Polo Space");

        long deOtra = entrar("Marco", "Nadir Labs");

        assertThat(deOtra).isNotEqualTo(deUna);
        assertThat(jugadores.findById(deOtra).orElseThrow().getNombreUsuario()).isEqualTo("Marco");
    }
}
