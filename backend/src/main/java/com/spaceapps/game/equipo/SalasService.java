package com.spaceapps.game.equipo;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.spaceapps.game.amigos.AmigosService;
import com.spaceapps.game.catalogo.Catalogo;
import com.spaceapps.game.catalogo.Estrella;
import com.spaceapps.game.equipo.SalaResponse.InvitacionResponse;
import com.spaceapps.game.jugador.Jugador;
import com.spaceapps.game.jugador.JugadorRepository;

import tools.jackson.databind.JsonNode;

// Las salas viven en memoria: el servidor no hace nada entre peticiones y los navegadores preguntan por la versión.
@Service
class SalasService {

    // Sin letras ni números que se confundan al dictar el código (0/O, 1/I/L).
    private static final String ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final int LARGO_CODIGO = 6;
    private static final Duration CADUCIDAD = Duration.ofHours(3);

    private final Map<String, Sala> salas = new ConcurrentHashMap<>();
    private final SecureRandom azar = new SecureRandom();
    private final Catalogo catalogo;
    private final JugadorRepository jugadores;
    private final AmigosService amigos;
    private final EvaluadorFases evaluador;
    private final RecompensasEquipo recompensas;

    SalasService(Catalogo catalogo, JugadorRepository jugadores, AmigosService amigos, EvaluadorFases evaluador,
            RecompensasEquipo recompensas) {
        this.catalogo = catalogo;
        this.jugadores = jugadores;
        this.amigos = amigos;
        this.evaluador = evaluador;
        this.recompensas = recompensas;
    }

    @Transactional(readOnly = true)
    SalaResponse crear(long jugadorId, String estrellaId) {
        Estrella estrella = catalogo.estrella(estrellaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown star " + estrellaId));
        limpiar();
        salirDeTodas(jugadorId);
        Sala sala = new Sala(codigoLibre(), estrella.id(), miembro(jugadorId), evaluador.para(estrella));
        salas.put(sala.codigo(), sala);
        return foto(sala);
    }

    // Devuelve vacío si el navegador ya tiene esta versión: así preguntar a menudo apenas cuesta.
    Optional<SalaResponse> ver(long jugadorId, String codigo, Long versionConocida) {
        Sala sala = salaDe(jugadorId, codigo);
        if (versionConocida != null && versionConocida == sala.version(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(foto(sala));
    }

    Optional<SalaResponse> mia(long jugadorId) {
        return salas.values().stream().filter(sala -> sala.contiene(jugadorId)).findFirst().map(this::foto);
    }

    @Transactional(readOnly = true)
    SalaResponse unirse(long jugadorId, String codigo) {
        Sala sala = buscar(codigo);
        if (!sala.contiene(jugadorId)) {
            salirDeTodas(jugadorId);
            sala.unir(miembro(jugadorId));
        }
        return foto(sala);
    }

    SalaResponse invitar(long jugadorId, String codigo, long invitadoId) {
        Sala sala = salaDe(jugadorId, codigo);
        if (!amigos.sonAmigos(jugadorId, invitadoId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only invite your friends");
        }
        sala.invitar(invitadoId);
        return foto(sala);
    }

    List<InvitacionResponse> invitaciones(long jugadorId) {
        return salas.values().stream()
                .filter(sala -> sala.invitaA(jugadorId))
                .map(sala -> new InvitacionResponse(sala.codigo(), nombreEstrella(sala), sala.anfitrion().nombreUsuario(),
                        sala.numeroDeMiembros()))
                .toList();
    }

    void salir(long jugadorId, String codigo) {
        Sala sala = salaDe(jugadorId, codigo);
        sala.salir(jugadorId);
        if (sala.vacia()) {
            salas.remove(codigo);
        }
    }

    SalaResponse empezar(long jugadorId, String codigo) {
        Sala sala = salaDe(jugadorId, codigo);
        sala.empezar(jugadorId, azar, Instant.now());
        return foto(sala);
    }

    SalaResponse enviarProgreso(long jugadorId, String codigo, Departamento departamento, JsonNode datos) {
        Sala sala = salaDe(jugadorId, codigo);
        sala.enviarProgreso(jugadorId, departamento, datos, Instant.now());
        return foto(sala);
    }

    SalaResponse enviarResultado(long jugadorId, String codigo, Departamento departamento, JsonNode datos) {
        Sala sala = salaDe(jugadorId, codigo);
        sala.enviarResultado(jugadorId, departamento, datos, Instant.now());
        return foto(sala);
    }

    // El navegador del anfitrión simula el vuelo (como en solitario); aquí se reparte la recompensa a cada miembro.
    // El bloqueo sobre la sala evita que dos peticiones a la vez paguen dos veces.
    @Transactional
    SalaResponse lanzar(long jugadorId, String codigo, boolean exito, JsonNode informe) {
        Sala sala = salaDe(jugadorId, codigo);
        synchronized (sala) {
            sala.comprobarLanzamiento(jugadorId, Instant.now());
            Teamwork teamwork = Teamwork.de(sala.resultados());
            List<RecompensasEquipo.Recompensa> repartidas = sala.miembros().stream()
                    .map(miembro -> recompensas.recompensar(miembro.jugadorId(), exito))
                    .toList();
            sala.registrarLanzamiento(exito, informe, teamwork, repartidas);
        }
        return foto(sala);
    }

    SalaResponse votar(long jugadorId, String codigo, Departamento departamento, List<String> piezaIds) {
        Sala sala = salaDe(jugadorId, codigo);
        evaluador.comprobarVoto(departamento, piezaIds);
        sala.votar(jugadorId, departamento, piezaIds, catalogo.reglasEquipo().maximoVotos(), Instant.now());
        return foto(sala);
    }

    private Sala salaDe(long jugadorId, String codigo) {
        Sala sala = buscar(codigo);
        if (!sala.contiene(jugadorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not in team " + codigo);
        }
        return sala;
    }

    private Sala buscar(String codigo) {
        Sala sala = salas.get(codigo.trim().toUpperCase());
        if (sala == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "There is no team with the code " + codigo);
        }
        return sala;
    }

    // Un jugador solo está en una sala: al crear o entrar en otra, sale de la anterior.
    private void salirDeTodas(long jugadorId) {
        salas.values().stream().filter(sala -> sala.contiene(jugadorId)).toList()
                .forEach(sala -> salir(jugadorId, sala.codigo()));
    }

    private void limpiar() {
        Instant limite = Instant.now().minus(CADUCIDAD);
        salas.values().removeIf(sala -> sala.vacia() || sala.inactivaDesde(limite));
    }

    // Solo entra en una sala quien ya ha completado su primera misión en solitario.
    private Sala.Miembro miembro(long jugadorId) {
        Jugador jugador = jugadores.findById(jugadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account " + jugadorId + " no longer exists"));
        if (!jugador.haAlcanzado(catalogo.reglasEquipo().destinoRequerido())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Complete your first solo mission to unlock team missions");
        }
        return new Sala.Miembro(jugadorId, jugador.getNombreUsuario(), jugador.getEmpresa().getNombre());
    }

    private String codigoLibre() {
        String codigo;
        do {
            StringBuilder nuevo = new StringBuilder(LARGO_CODIGO);
            for (int i = 0; i < LARGO_CODIGO; i++) {
                nuevo.append(ALFABETO_CODIGO.charAt(azar.nextInt(ALFABETO_CODIGO.length())));
            }
            codigo = nuevo.toString();
        } while (salas.containsKey(codigo));
        return codigo;
    }

    private String nombreEstrella(Sala sala) {
        return catalogo.estrella(sala.estrellaId()).map(Estrella::nombre).orElse(sala.estrellaId());
    }

    private SalaResponse foto(Sala sala) {
        return sala.foto(nombreEstrella(sala), Instant.now());
    }
}
