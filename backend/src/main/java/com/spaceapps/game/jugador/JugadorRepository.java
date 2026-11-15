package com.spaceapps.game.jugador;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JugadorRepository extends JpaRepository<Jugador, Long> {

    // clave = Jugador.clave(nombre, empresa)
    Optional<Jugador> findByClave(String clave);

    // Jugadores de antes de entrar con nombre + empresa (ver MigracionEntradaSinCuenta).
    List<Jugador> findByClaveIsNull();

    List<Jugador> findTop10ByNombreUsuarioContainingIgnoreCaseAndIdNotOrderByNombreUsuario(String texto, Long excluido);
}
