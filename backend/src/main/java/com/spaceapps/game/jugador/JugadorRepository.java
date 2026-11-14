package com.spaceapps.game.jugador;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JugadorRepository extends JpaRepository<Jugador, Long> {

    Optional<Jugador> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNombreUsuario(String nombreUsuario);

    Optional<Jugador> findByNombreUsuarioIgnoreCase(String nombreUsuario);

    List<Jugador> findTop10ByNombreUsuarioContainingIgnoreCaseAndIdNotOrderByNombreUsuario(String texto, Long excluido);
}
