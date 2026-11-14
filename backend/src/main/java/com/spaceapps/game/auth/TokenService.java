package com.spaceapps.game.auth;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.spaceapps.game.jugador.Jugador;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final Duration duracion;

    TokenService(JwtEncoder jwtEncoder, @Value("${app.jwt.duracion}") Duration duracion) {
        this.jwtEncoder = jwtEncoder;
        this.duracion = duracion;
    }

    public String emitir(Jugador jugador) {
        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(jugador.getId().toString())
                .issuedAt(ahora)
                .expiresAt(ahora.plus(duracion))
                .build();
        JwsHeader cabecera = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(cabecera, claims)).getTokenValue();
    }
}
