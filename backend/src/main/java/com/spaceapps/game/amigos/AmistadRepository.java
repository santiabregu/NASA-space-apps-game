package com.spaceapps.game.amigos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface AmistadRepository extends JpaRepository<Amistad, Long> {

    @Query("select a from Amistad a join fetch a.solicitante join fetch a.destinatario where a.solicitante.id = :jugadorId or a.destinatario.id = :jugadorId")
    List<Amistad> delJugador(long jugadorId);

    @Query("select a from Amistad a where (a.solicitante.id = :uno and a.destinatario.id = :otro) or (a.solicitante.id = :otro and a.destinatario.id = :uno)")
    Optional<Amistad> entre(long uno, long otro);
}
