package com.spaceapps.game.auth;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import com.spaceapps.game.jugador.JugadorRepository;

// Si la base se borra (Render, plan gratuito), los ids vuelven a empezar y un token antiguo abriría la cuenta de otra persona.
// El instante de alta distingue a la cuenta para la que se emitió el token.
class ValidadorCuentaDelToken implements OAuth2TokenValidator<Jwt> {

    static final String CLAIM_ALTA = "alta";

    private static final OAuth2Error CUENTA_DISTINTA = new OAuth2Error("invalid_token",
            "This session belongs to a game that no longer exists. Enter your name and company again.", null);

    private final JugadorRepository jugadores;

    ValidadorCuentaDelToken(JugadorRepository jugadores) {
        this.jugadores = jugadores;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        if (!(token.getClaims().get(CLAIM_ALTA) instanceof Number alta)) {
            return OAuth2TokenValidatorResult.failure(CUENTA_DISTINTA);
        }
        boolean esLaMismaCuenta = jugadores.findById(Long.parseLong(token.getSubject()))
                .map(jugador -> jugador.getCreadoEn().toEpochMilli() == alta.longValue())
                .orElse(false);
        return esLaMismaCuenta ? OAuth2TokenValidatorResult.success() : OAuth2TokenValidatorResult.failure(CUENTA_DISTINTA);
    }
}
