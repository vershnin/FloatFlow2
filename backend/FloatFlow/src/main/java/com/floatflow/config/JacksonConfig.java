package com.floatflow.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.TimeZone;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Register the Java 8 date/time module (LocalDate, LocalDateTime, etc.)
        mapper.registerModule(new JavaTimeModule());

        // Write dates as ISO-8601 strings, not as numeric timestamps or arrays
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Set timezone to Nairobi (EAT, UTC+3) for consistent date display
        mapper.setTimeZone(TimeZone.getTimeZone("Africa/Nairobi"));

        return mapper;
    }
}