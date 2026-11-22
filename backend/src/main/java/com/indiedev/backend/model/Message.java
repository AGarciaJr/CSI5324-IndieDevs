/* An object storing information for a single message, persisted in the database
 */

package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id")
    private Long conversationId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "recipient_id")
    private Long recipientId;

    @Column(name = "recipient_name")
    private String recipientName;

    @Column(name = "message_text", length = 4000, nullable = false)
    private String messageText;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    public Message(Long senderId, String messageText) {
        this.senderId = senderId;
        this.messageText = messageText;
        this.timestamp = LocalDateTime.now();
    }

    public Message(Long conversationId, Long senderId, String senderName, Long recipientId, String recipientName, String messageText) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.recipientId = recipientId;
        this.recipientName = recipientName;
        this.messageText = messageText;
        this.timestamp = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
