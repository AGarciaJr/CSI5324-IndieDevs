package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/* A message from the system to a user, such as the outcome of a report. */
@Entity
@Table(name = "notifications")
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long recipientId;

    @Column(nullable = false, length = 500)
    private String message;

    private LocalDateTime createdAt;

    public Notification() {
        createdAt = LocalDateTime.now();
    }

    public Notification(Long recipientId, String message) {
        this();
        this.recipientId = recipientId;
        this.message = message;
    }

}
