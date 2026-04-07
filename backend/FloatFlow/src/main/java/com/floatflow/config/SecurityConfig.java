package com.floatflow.config;

import com.floatflow.repository.UserRepository;
import com.floatflow.security.JwtAuthenticationFilter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity  
@Slf4j
public class SecurityConfig {

    private final UserRepository userRepository;

    public SecurityConfig(UserRepository userRepository) {
        
        this.userRepository = userRepository;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationFilter jwtAuthFilter,
        com.floatflow.security.CustomAuthenticationEntryPoint authEntryPoint,
        AccessDeniedHandler accessDeniedHandler
    ) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST,
                    "/api/auth/login",
                    "/api/auth/register"
                ).permitAll()
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/api-docs/**",
                    "/v3/api-docs/**"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/floats")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER")
                .requestMatchers(HttpMethod.GET, "/api/floats/active/my-branch")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/api/floats")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER")
                .requestMatchers(HttpMethod.PUT, "/api/floats/*/topup")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/floats/*/close")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER")
                .requestMatchers(HttpMethod.GET, "/api/floats/*/transactions")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER")

                .requestMatchers(HttpMethod.GET, "/api/expenses")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER")
                .requestMatchers(HttpMethod.GET, "/api/expenses/my")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER", "EMPLOYEE", "AUDITOR")
                .requestMatchers(HttpMethod.GET, "/api/expenses/pending")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/expenses")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.PUT, "/api/expenses/*/approve", "/api/expenses/*/reject")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER")

                .requestMatchers(HttpMethod.GET, "/api/policies")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER")
                .requestMatchers(HttpMethod.POST, "/api/policies")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER")
                .requestMatchers(HttpMethod.PUT, "/api/policies/*")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER")
                .requestMatchers(HttpMethod.PATCH, "/api/policies/*")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER")
                .requestMatchers(HttpMethod.DELETE, "/api/policies/*")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER")

                .requestMatchers(HttpMethod.GET, "/api/reports/**")
                    .hasAnyRole("ADMIN", "FINANCE_OFFICER", "AUDITOR")

                .requestMatchers(HttpMethod.GET, "/api/audit", "/api/audit/**")
                    .hasAnyRole("ADMIN", "AUDITOR")

                .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")

                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",
            "http://localhost:5173",
            "https://*.yourdomain.com"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public ApplicationRunner securityMatcherOrderLogger() {
        return args -> {
            log.info("Security matcher order [1]: POST /api/auth/login, /api/auth/register -> permitAll");
            log.info("Security matcher order [2]: GET /api/floats -> ADMIN, FINANCE_OFFICER, BRANCH_MANAGER");
            log.info("Security matcher order [3]: GET /api/floats/active/my-branch -> ADMIN, FINANCE_OFFICER, BRANCH_MANAGER, EMPLOYEE");
            log.info("Security matcher order [4]: GET /api/expenses -> ADMIN, FINANCE_OFFICER");
            log.info("Security matcher order [5]: GET /api/expenses/my -> ADMIN, FINANCE_OFFICER, BRANCH_MANAGER, EMPLOYEE, AUDITOR");
            log.info("Security matcher order [6]: GET /api/audit, /api/audit/** -> ADMIN, AUDITOR");
            log.info("Security matcher order [7]: /api/admin/** -> ADMIN");
            log.info("Security matcher order [8]: /api/** -> authenticated catch-all");
        };
    }
}
