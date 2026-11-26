/* An object storing information for a conversation between two users,
 * including the users' ids, names, last message summary, and message history
 */

package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user1_id", nullable = false)
    private Long user1Id;

    @Column(name = "user1_name")
    private String user1Name;

    @Column(name = "user2_id", nullable = false)
    private Long user2Id;

    @Column(name = "user2_name")
    private String user2Name;

    @Column(name = "last_message_text", columnDefinition = "TEXT")
    private String lastMessageText;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Transient
    private List<Message> messages = new ArrayList<>();

    public Conversation(Long user1Id, String user1Name, Long user2Id, String user2Name) {
        this.user1Id = user1Id;
        this.user1Name = user1Name;
        this.user2Id = user2Id;
        this.user2Name = user2Name;
        this.lastMessageAt = LocalDateTime.now();
    }

    public void addMessage(Message message) {
        if (this.messages == null) {
            this.messages = new ArrayList<>();
        }
        this.messages.add(message);
        if (message != null) {
            this.lastMessageText = message.getMessageText();
            this.lastMessageAt = message.getTimestamp() != null ? message.getTimestamp() : LocalDateTime.now();
        }
    }
}
