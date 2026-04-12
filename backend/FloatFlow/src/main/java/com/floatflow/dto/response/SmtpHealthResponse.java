package com.floatflow.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SmtpHealthResponse {
    private boolean healthy;
    private boolean mailEnabled;
    private String host;
    private int port;
    private String fromAddress;
    private String message;
}
