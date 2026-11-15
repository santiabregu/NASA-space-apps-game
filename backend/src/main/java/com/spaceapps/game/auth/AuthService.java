package com.spaceapps.game.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceapps.game.catalogo.Catalogo;
import com.spaceapps.game.empresa.Empresa;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

// Sin contraseñas: el nombre y la empresa identifican la partida. Si la pareja ya existe se continúa; si no, empieza una nueva.
// Cualquiera que conozca la pareja entra en esa partida: es lo que se pidió para que jugar sea inmediato.
@Service
public class AuthService {

    private final JugadorRepository jugadores;
    private final TokenService tokenService;
    private final Catalogo catalogo;

    AuthService(JugadorRepository jugadores, TokenService tokenService, Catalogo catalogo) {
        this.jugadores = jugadores;
        this.tokenService = tokenService;
        this.catalogo = catalogo;
    }

    @Transactional
    public String entrar(EntradaRequest datos) {
        String nombreUsuario = limpiar(datos.nombreUsuario());
        String nombreEmpresa = limpiar(datos.nombreEmpresa());
        Jugador jugador = jugadores.findByClave(Jugador.clave(nombreUsuario, nombreEmpresa))
                .orElseGet(() -> jugadores.save(new Jugador(nombreUsuario, new Empresa(nombreEmpresa), catalogo.kitInicial(),
                        catalogo.mesLimite())));
        return tokenService.emitir(jugador);
    }

    private static String limpiar(String texto) {
        return texto.strip().replaceAll("\\s+", " ");
    }
}
