package com.floatflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_user_read", columnList = "user_id, isRead")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // LAZY relationship — must NOT be serialized directly by Jackson
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Expose userId as a plain field — safe to serialize, no lazy proxy involved
    @Transient
    @JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String type = "system";

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(length = 255)
    private String link;

    // @JsonProperty("read") forces the JSON key to "read" not "isRead" or "read"
    // so the frontend n.read check works correctly.
    @Builder.Default
    @Column(name = "isRead")
    @JsonProperty("read")
    private boolean isRead = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.type == null)  this.type  = "system";
        if (this.title == null) this.title = "Notification";
    }

    // "timestamp" alias — frontend Notification interface uses n.timestamp for display
    @Transient
    @JsonProperty("timestamp")
    public LocalDateTime getTimestamp() {
        return this.createdAt;
    }
}