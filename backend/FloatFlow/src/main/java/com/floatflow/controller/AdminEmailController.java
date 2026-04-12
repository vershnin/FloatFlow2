package com.floatflow.controller;

import com.floatflow.dto.response.ApiResponse;
import com.floatflow.dto.response.SmtpHealthResponse;
import com.floatflow.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/email")
@RequiredArgsConstructor
public class AdminEmailController {

    private final EmailService emailService;

    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SmtpHealthResponse>> getSmtpHealth() {
        SmtpHealthResponse response = emailService.checkSmtpHealth();
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }
}
