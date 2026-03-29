package com.floatflow.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures Swagger UI for API documentation.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI floatFlowOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("FloatFlow API")
                .description("Float & Petty Cash Management System — REST API Documentation")
                .version("1.0.0")
                .contact(new Contact()
                    .name("Orinda Richard Gak")
                    .email("2205815@students.kca.ac.ke")))
            // Enables the "Authorize" button in Swagger UI
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .name("bearerAuth")
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Paste your JWT token here. Get it from POST /api/auth/login")));
    }
}
