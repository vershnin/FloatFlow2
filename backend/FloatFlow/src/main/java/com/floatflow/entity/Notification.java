package com.floatflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * In-app notification for users (expense approved, float low, etc.)
 * Future enhancement: Push via WebSocket in real-time.
 */
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 100)
    private String type;

    @Column(length = 200)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(length = 300)
    private String link;

    @Builder.Default
    private boolean isRead = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
