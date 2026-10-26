package com.IndustrialMart.Backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthenticationSecurityTests {
    @Autowired MockMvc mvc;

    @Test
    void authenticationEndpointsRemainPublic() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void applicationDataAndBuyerEndpointsRequireAuthentication() throws Exception {
        mvc.perform(get("/api/categories")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/listings")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/prototype/buyer/unlocks")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/prototype/buyer/listings/1/details")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/listings/images/00000000-0000-0000-0000-000000000001.jpg"))
                .andExpect(status().isUnauthorized());
    }
}
