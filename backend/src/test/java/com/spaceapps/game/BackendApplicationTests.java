package com.spaceapps.game;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:test",
        "app.jwt.secret=secreto-de-prueba-con-al-menos-32-bytes"
})
class BackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
