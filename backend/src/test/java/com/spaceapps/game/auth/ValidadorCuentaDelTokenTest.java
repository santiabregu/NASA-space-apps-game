package com.spaceapps.game.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtValidationException;

import com.spaceapps.game.catalogo.KitInicial;
import com.spaceapps.game.empresa.Empresa;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:test",
        "app.jwt.secret=secreto-de-prueba-con-al-menos-32-bytes"
})
class ValidadorCuentaDelTokenTest {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Autowired
    private JwtDecoder jwtDecoder;

    @Autowired
    private JugadorRepository jugadores;

    private Jugador nuevoJugador(String nombre) {
        return jugadores.save(new Jugador(nombre, new Empresa(nombre), new KitInicial(0, Map.of()), 12));
    }

    private String token(Jugador jugador, Object alta) {
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .subject(jugador.getId().toString())
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60));
        if (alta != null) {
            claims.claim(ValidadorCuentaDelToken.CLAIM_ALTA, alta);
        }
        return jwtEncoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims.build())).getTokenValue();
    }

    @Test
    void aceptaElTokenDeSuPropiaCuenta() {
        Jugador ana = nuevoJugador("ana-valida");

        assertThat(jwtDecoder.decode(tokenService.emitir(ana)).getSubject()).isEqualTo(ana.getId().toString());
    }

    @Test
    void aceptaElTokenTrasLeerLaCuentaDeLaBase() {
        Jugador ana = nuevoJugador("ana-releida");
        Jugador releida = jugadores.findById(ana.getId()).orElseThrow();

        assertThat(jwtDecoder.decode(tokenService.emitir(releida)).getSubject()).isEqualTo(ana.getId().toString());
    }

    @Test
    void rechazaUnTokenDeOtraCuentaConElMismoId() {
        Jugador beto = nuevoJugador("beto-reutiliza-id");
        long altaDeOtraCuenta = beto.getCreadoEn().toEpochMilli() - 86_400_000;

        assertThatThrownBy(() -> jwtDecoder.decode(token(beto, altaDeOtraCuenta))).isInstanceOf(JwtValidationException.class);
    }

    @Test
    void rechazaLosTokensAntiguosSinFechaDeAlta() {
        Jugador carla = nuevoJugador("carla-token-viejo");

        assertThatThrownBy(() -> jwtDecoder.decode(token(carla, null))).isInstanceOf(JwtValidationException.class);
    }
}
