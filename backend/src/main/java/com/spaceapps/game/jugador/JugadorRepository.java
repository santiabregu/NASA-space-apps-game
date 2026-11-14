package com.spaceapps.game.jugador;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JugadorRepository extends JpaRepository<Jugador, Long> {

    Optional<Jugador> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNombreUsuario(String nombreUsuario);
}
