/* An object storing information for a conversation between two users,
 * including the users' ids and the messages sent
 */

package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;

@Entity
@Table(name = "conversations")
@Getter
@Setter
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long user1Id;
    private Long user2Id;

    private ArrayList<Message> messages;

    // Append a new message to this conversation
    public void addMessage(Message message) {
        messages.add(message);
    }
}
