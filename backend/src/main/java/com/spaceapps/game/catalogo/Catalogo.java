package com.spaceapps.game.catalogo;

import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import tools.jackson.databind.json.JsonMapper;

@Component
public class Catalogo {

    private final byte[] json;
    private final Map<String, PiezaCatalogo> piezas;
    private final List<MisionCatalogo> misiones;
    private final List<Destino> destinos;
    private final List<Estrella> estrellas;
    private final KitInicial kitInicial;
    private final int mesLimite;
    private final int misionesConAmigos;
    private final Map<String, Pregunta> preguntas;
    private final ReglasEquipo reglasEquipo;

    Catalogo(JsonMapper jsonMapper, @Value("classpath:catalogo.json") Resource fichero) throws IOException {
        this.json = fichero.getContentAsByteArray();
        Contenido contenido = jsonMapper.readValue(json, Contenido.class);
        this.piezas = contenido.piezas().stream().collect(toMap(PiezaCatalogo::id, identity()));
        this.misiones = contenido.misiones();
        this.destinos = contenido.destinos();
        this.estrellas = contenido.estrellas();
        this.kitInicial = contenido.kitInicial();
        this.mesLimite = contenido.mesLimite();
        this.misionesConAmigos = contenido.misionesConAmigos();
        this.preguntas = contenido.preguntas().stream().collect(toMap(Pregunta::id, identity()));
        this.reglasEquipo = contenido.equipo();
    }

    public byte[] json() {
        return json;
    }

    public Optional<PiezaCatalogo> pieza(String id) {
        return Optional.ofNullable(piezas.get(id));
    }

    public Optional<MisionCatalogo> mision(String id) {
        return misiones.stream().filter(mision -> mision.id().equals(id)).findFirst();
    }

    public List<MisionCatalogo> misiones() {
        return misiones;
    }

    public Optional<Destino> destino(String id) {
        return destinos.stream().filter(destino -> destino.id().equals(id)).findFirst();
    }

    // En el orden en que se alcanzan en la campaña.
    public List<Destino> destinos() {
        return destinos.stream().sorted(Comparator.comparingInt(Destino::orden)).toList();
    }

    // Donde termina la campaña: la Luna en la demo, New Home cuando deje de ser «Coming soon».
    public Destino ultimoDestinoJugable() {
        return destinos().stream().filter(destino -> !destino.esProximamente()).reduce((anterior, siguiente) -> siguiente)
                .orElseThrow(() -> new IllegalStateException("El catálogo no tiene ningún destino jugable"));
    }

    public Optional<Destino> destinoQueAlcanza(String misionId) {
        return destinos.stream().filter(destino -> misionId.equals(destino.misionId())).findFirst();
    }

    public Optional<Estrella> estrella(String id) {
        return estrellas.stream().filter(estrella -> estrella.id().equals(id)).findFirst();
    }

    public KitInicial kitInicial() {
        return kitInicial;
    }

    public int mesLimite() {
        return mesLimite;
    }

    // Misiones de equipo ganadas con amigos que hacen falta para los finales «con amigos».
    public int misionesConAmigos() {
        return misionesConAmigos;
    }

    public Optional<Pregunta> pregunta(String id) {
        return Optional.ofNullable(preguntas.get(id));
    }

    public ReglasEquipo reglasEquipo() {
        return reglasEquipo;
    }

    private record Contenido(List<PiezaCatalogo> piezas, List<MisionCatalogo> misiones, List<Destino> destinos,
            List<Estrella> estrellas, KitInicial kitInicial, int mesLimite, int misionesConAmigos, List<Pregunta> preguntas,
            ReglasEquipo equipo) {
    }
}
