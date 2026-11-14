package com.spaceapps.game.auth;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.spaceapps.game.empresa.Empresa;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

@Service
public class AuthService {

    private final JugadorRepository jugadores;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    AuthService(JugadorRepository jugadores, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.jugadores = jugadores;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public String registrar(RegistroRequest datos) {
        String email = normalizarEmail(datos.email());
        String nombreUsuario = datos.nombreUsuario().trim();
        if (jugadores.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with the email " + email + " already exists");
        }
        if (jugadores.existsByNombreUsuario(nombreUsuario)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The username " + nombreUsuario + " is already taken");
        }
        Empresa empresa = new Empresa(datos.nombreEmpresa().trim());
        Jugador jugador = jugadores.save(new Jugador(email, passwordEncoder.encode(datos.password()), nombreUsuario, empresa));
        return tokenService.emitir(jugador);
    }

    public String iniciarSesion(LoginRequest credenciales) {
        return jugadores.findByEmail(normalizarEmail(credenciales.email()))
                .filter(jugador -> passwordEncoder.matches(credenciales.password(), jugador.getPasswordHash()))
                .map(tokenService::emitir)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password"));
    }

    private static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
