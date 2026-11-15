package com.spaceapps.game.jugador;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

// Adapta una base creada cuando había registro con email y contraseña (ddl-auto=update no quita columnas ni restricciones):
// sin esto, los jugadores nuevos chocarían con el email obligatorio y los antiguos no se encontrarían por nombre + empresa.
// En una base nueva o ya migrada no hace nada.
@Component
class MigracionEntradaSinCuenta implements ApplicationRunner {

    private static final List<String> COLUMNAS_DE_CUENTA = List.of("EMAIL", "PASSWORD_HASH");

    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaccion;
    private final JugadorRepository jugadores;

    MigracionEntradaSinCuenta(JdbcTemplate jdbc, TransactionTemplate transaccion, JugadorRepository jugadores) {
        this.jdbc = jdbc;
        this.transaccion = transaccion;
        this.jugadores = jugadores;
    }

    @Override
    public void run(ApplicationArguments argumentos) {
        // El nombre ya no es único por sí solo: lo es junto con la empresa.
        quitarRestriccionesUnicas("NOMBRE_USUARIO");
        for (String columna : COLUMNAS_DE_CUENTA) {
            if (existeColumna(columna)) {
                quitarRestriccionesUnicas(columna);
                jdbc.execute("ALTER TABLE JUGADOR DROP COLUMN " + columna);
            }
        }
        transaccion.executeWithoutResult(estado -> jugadores.findByClaveIsNull().forEach(Jugador::completarClave));
    }

    private boolean existeColumna(String columna) {
        Integer cuantas = jdbc.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE UPPER(TABLE_NAME) = 'JUGADOR' AND UPPER(COLUMN_NAME) = ?",
                Integer.class, columna);
        return cuantas != null && cuantas > 0;
    }

    private void quitarRestriccionesUnicas(String columna) {
        List<String> restricciones = jdbc.queryForList("""
                SELECT tc.CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
                  ON k.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND k.TABLE_NAME = tc.TABLE_NAME
                WHERE UPPER(tc.TABLE_NAME) = 'JUGADOR' AND tc.CONSTRAINT_TYPE = 'UNIQUE' AND UPPER(k.COLUMN_NAME) = ?
                """, String.class, columna);
        restricciones.forEach(nombre -> jdbc.execute("ALTER TABLE JUGADOR DROP CONSTRAINT \"" + nombre + "\""));
    }
}
