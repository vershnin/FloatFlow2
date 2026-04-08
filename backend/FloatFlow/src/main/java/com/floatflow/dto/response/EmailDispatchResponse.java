package com.floatflow.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmailDispatchResponse {
    private boolean delivered;
    private boolean queued;
    private String message;
}
