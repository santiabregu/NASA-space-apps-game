package com.spaceapps.game.equipo;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;

// Una partida de equipo. Vive solo en memoria: si el servidor se reinicia, la sala desaparece.
// Cada cambio sube la versión, y así los navegadores saben si tienen que redibujar.
// No hay temporizadores: cada método que recibe "ahora" resuelve primero las fases que ya caducaron.
class Sala {

    static final int MAXIMO_MIEMBROS = 4;
    static final int MINIMO_MIEMBROS = 2;
    static final Duration REPARTO = Duration.ofSeconds(12);
    static final Duration PAUSA_ENTRE_FASES = Duration.ofSeconds(5);
    static final int MAXIMO_CARACTERES_DATOS = 2000;
    static final int MAXIMO_CARACTERES_INFORME = 4000;

    enum Estado {
        ESPERA,
        EN_JUEGO,
        TERMINADA,
        LANZADA
    }

    record Miembro(long jugadorId, String nombreUsuario, String empresa) {
    }

    // datos es lo que devolvió el EvaluadorFase. tiempoRestante: fracción del tiempo de la fase que sobró al entregar (0 si caducó).
    // votos cuenta cuántos compañeros votaron cada pieza, de más a menos.
    record Resultado(JsonNode datos, boolean caducado, double tiempoRestante, Map<String, Integer> votos) {
    }

    // informe lo calcula el navegador del anfitrión con el motor de simulación: así todos ven el mismo vuelo.
    record Lanzamiento(boolean exito, JsonNode informe, Teamwork teamwork, List<RecompensasEquipo.Recompensa> recompensas) {
    }

    private final String codigo;
    private final String estrellaId;
    private final List<Miembro> miembros = new ArrayList<>();
    private final Set<Long> invitados = new HashSet<>();
    private final Map<Departamento, Long> responsables = new EnumMap<>(Departamento.class);
    private final Map<Departamento, Resultado> resultados = new EnumMap<>(Departamento.class);
    private final Map<Long, List<String>> votos = new LinkedHashMap<>();
    private final EvaluadorFase evaluador;
    private long anfitrionId;
    private Estado estado = Estado.ESPERA;
    private int indiceFase;
    private Instant empiezaEn;
    private Instant terminaEn;
    private JsonNode progreso;
    private Lanzamiento lanzamiento;
    private long version;
    private Instant ultimaActividad = Instant.now();

    Sala(String codigo, String estrellaId, Miembro anfitrion, EvaluadorFase evaluador) {
        this.codigo = codigo;
        this.estrellaId = estrellaId;
        this.evaluador = evaluador;
        this.anfitrionId = anfitrion.jugadorId();
        this.miembros.add(anfitrion);
    }

    synchronized void unir(Miembro miembro) {
        if (contiene(miembro.jugadorId())) {
            return;
        }
        if (estado != Estado.ESPERA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This mission has already started");
        }
        if (miembros.size() >= MAXIMO_MIEMBROS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The team is full");
        }
        miembros.add(miembro);
        invitados.remove(miembro.jugadorId());
        cambiar();
    }

    // Si se va el anfitrión, el siguiente miembro pasa a dirigir la sala.
    // Si se va alguien en plena partida, sus departamentos se resuelven solos al caducar.
    synchronized void salir(long jugadorId) {
        if (miembros.removeIf(miembro -> miembro.jugadorId() == jugadorId)) {
            if (anfitrionId == jugadorId && !miembros.isEmpty()) {
                anfitrionId = miembros.getFirst().jugadorId();
            }
            cambiar();
        }
    }

    synchronized void invitar(long jugadorId) {
        if (invitados.add(jugadorId)) {
            cambiar();
        }
    }

    // Reparte los cuatro departamentos al azar; con menos de cuatro jugadores alguno lleva dos.
    // La primera fase espera un poco para que todos lean el reparto.
    synchronized void empezar(long solicitanteId, Random azar, Instant ahora) {
        if (solicitanteId != anfitrionId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can start the mission");
        }
        if (estado != Estado.ESPERA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The mission has already started");
        }
        if (miembros.size() < MINIMO_MIEMBROS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You need at least " + MINIMO_MIEMBROS + " players");
        }
        List<Miembro> barajados = new ArrayList<>(miembros);
        Collections.shuffle(barajados, azar);
        Departamento[] departamentos = Departamento.values();
        for (int i = 0; i < departamentos.length; i++) {
            responsables.put(departamentos[i], barajados.get(i % barajados.size()).jugadorId());
        }
        estado = Estado.EN_JUEGO;
        arrancarFase(0, ahora.plus(REPARTO));
        cambiar();
    }

    // El progreso es lo que ven en vivo los demás; solo se guarda el último.
    synchronized void enviarProgreso(long jugadorId, Departamento departamento, JsonNode datos, Instant ahora) {
        avanzar(ahora);
        comprobarTurno(jugadorId, departamento, ahora);
        progreso = validar(datos, MAXIMO_CARACTERES_DATOS);
        cambiar();
    }

    // Entregar el resultado cierra la fase sin esperar a que se acabe el tiempo.
    // Si el evaluador lo rechaza (por ejemplo, por pasarse del presupuesto), la fase sigue abierta.
    synchronized void enviarResultado(long jugadorId, Departamento departamento, JsonNode datos, Instant ahora) {
        avanzar(ahora);
        comprobarTurno(jugadorId, departamento, ahora);
        JsonNode evaluado = evaluador.evaluar(departamento, validar(datos, MAXIMO_CARACTERES_DATOS), false, resultados);
        resolver(evaluado, false, ahora);
    }

    // Voto consultivo: el constructor ve las piezas que proponen los demás, pero decide él.
    // Cada voto nuevo de un jugador sustituye al anterior.
    synchronized void votar(long jugadorId, Departamento departamento, List<String> piezaIds, int maximoVotos, Instant ahora) {
        avanzar(ahora);
        if (estado != Estado.EN_JUEGO || departamento != departamentoActual() || !departamento.construccion()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You can't vote in this phase");
        }
        if (responsables.get(departamento) == jugadorId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are the builder: install the parts yourself");
        }
        List<String> distintas = piezaIds.stream().distinct().toList();
        if (distintas.size() > maximoVotos) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have " + maximoVotos + " votes");
        }
        votos.put(jugadorId, distintas);
        cambiar();
    }

    // Solo el anfitrión, y solo cuando las cuatro fases están resueltas (la última puede caducar justo ahora).
    synchronized void comprobarLanzamiento(long solicitanteId, Instant ahora) {
        avanzar(ahora);
        if (solicitanteId != anfitrionId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can launch");
        }
        if (estado != Estado.TERMINADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    estado == Estado.LANZADA ? "The mission has already launched" : "The mission is not ready to launch");
        }
    }

    synchronized void registrarLanzamiento(boolean exito, JsonNode informe, Teamwork teamwork,
            List<RecompensasEquipo.Recompensa> recompensas) {
        lanzamiento = new Lanzamiento(exito, validar(informe, MAXIMO_CARACTERES_INFORME), teamwork, List.copyOf(recompensas));
        estado = Estado.LANZADA;
        cambiar();
    }

    synchronized Map<Departamento, Resultado> resultados() {
        return new EnumMap<>(resultados);
    }

    synchronized List<Miembro> miembros() {
        return List.copyOf(miembros);
    }

    synchronized boolean contiene(long jugadorId) {
        return miembros.stream().anyMatch(miembro -> miembro.jugadorId() == jugadorId);
    }

    synchronized boolean invitaA(long jugadorId) {
        return estado == Estado.ESPERA && invitados.contains(jugadorId) && !contiene(jugadorId);
    }

    synchronized boolean vacia() {
        return miembros.isEmpty();
    }

    synchronized boolean inactivaDesde(Instant limite) {
        return ultimaActividad.isBefore(limite);
    }

    synchronized SalaResponse foto(String nombreEstrella, Instant ahora) {
        avanzar(ahora);
        List<SalaResponse.MiembroResponse> lista = miembros.stream()
                .map(miembro -> new SalaResponse.MiembroResponse(miembro.jugadorId(), miembro.nombreUsuario(), miembro.empresa(),
                        departamentosDe(miembro.jugadorId())))
                .toList();
        SalaResponse.FaseResponse fase = estado == Estado.EN_JUEGO
                ? new SalaResponse.FaseResponse(departamentoActual(), empiezaEn.toEpochMilli(), terminaEn.toEpochMilli(), progreso,
                        new LinkedHashMap<>(votos))
                : null;
        return new SalaResponse(codigo, estrellaId, nombreEstrella, estado, anfitrionId, lista, List.copyOf(invitados), fase,
                new EnumMap<>(resultados), lanzamiento, ahora.toEpochMilli(), version);
    }

    synchronized long version(Instant ahora) {
        avanzar(ahora);
        return version;
    }

    synchronized Miembro anfitrion() {
        return miembros.stream().filter(miembro -> miembro.jugadorId() == anfitrionId).findFirst().orElseThrow();
    }

    synchronized int numeroDeMiembros() {
        return miembros.size();
    }

    String codigo() {
        return codigo;
    }

    String estrellaId() {
        return estrellaId;
    }

    // Si nadie consultó durante un rato pueden haber caducado varias fases seguidas: cada una
    // empieza cuando debía haber empezado la anterior, no cuando alguien vuelve a preguntar.
    private void avanzar(Instant ahora) {
        while (estado == Estado.EN_JUEGO && !ahora.isBefore(terminaEn)) {
            resolver(evaluarCaducada(), true, terminaEn);
        }
    }

    // El progreso lo manda el navegador: si no se puede evaluar, la fase cuenta como no jugada.
    private JsonNode evaluarCaducada() {
        try {
            return evaluador.evaluar(departamentoActual(), progreso, true, resultados);
        } catch (ResponseStatusException progresoInvalido) {
            return evaluador.evaluar(departamentoActual(), null, true, resultados);
        }
    }

    private void resolver(JsonNode evaluado, boolean caducado, Instant fin) {
        double tiempoRestante = caducado
                ? 0
                : Math.max(0, Duration.between(fin, terminaEn).toMillis()) / (double) departamentoActual().duracion().toMillis();
        resultados.put(departamentoActual(), new Resultado(evaluado, caducado, tiempoRestante, contarVotos()));
        if (indiceFase == Departamento.values().length - 1) {
            estado = Estado.TERMINADA;
            empiezaEn = null;
            terminaEn = null;
            progreso = null;
        } else {
            arrancarFase(indiceFase + 1, fin.plus(PAUSA_ENTRE_FASES));
        }
        cambiar();
    }

    private void arrancarFase(int indice, Instant inicio) {
        indiceFase = indice;
        empiezaEn = inicio;
        terminaEn = inicio.plus(departamentoActual().duracion());
        progreso = null;
        votos.clear();
    }

    // De más votada a menos; a igualdad de votos, la que se votó antes.
    private Map<String, Integer> contarVotos() {
        Map<String, Integer> conteo = new LinkedHashMap<>();
        votos.values().forEach(lista -> lista.forEach(pieza -> conteo.merge(pieza, 1, Integer::sum)));
        Map<String, Integer> ordenado = new LinkedHashMap<>();
        conteo.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .forEach(voto -> ordenado.put(voto.getKey(), voto.getValue()));
        return ordenado;
    }

    private void comprobarTurno(long jugadorId, Departamento departamento, Instant ahora) {
        if (estado != Estado.EN_JUEGO || departamento != departamentoActual()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That phase is not being played right now");
        }
        if (responsables.get(departamento) != jugadorId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "It is not your turn");
        }
        if (ahora.isBefore(empiezaEn)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The phase has not started yet");
        }
    }

    private static JsonNode validar(JsonNode datos, int maximoCaracteres) {
        if (datos == null || !datos.isObject()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The data must be a JSON object");
        }
        if (datos.toString().length() > maximoCaracteres) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The data is too large");
        }
        return datos;
    }

    private Departamento departamentoActual() {
        return Departamento.values()[indiceFase];
    }

    private List<Departamento> departamentosDe(long jugadorId) {
        return responsables.entrySet().stream()
                .filter(responsable -> responsable.getValue() == jugadorId)
                .map(Map.Entry::getKey)
                .toList();
    }

    private void cambiar() {
        version++;
        ultimaActividad = Instant.now();
    }
}
