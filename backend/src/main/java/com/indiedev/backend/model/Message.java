/* An object storing only the information for a single message (to be stored in a conversation object)
 */

package com.indiedev.backend.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class Message {
    private Long senderId;
    private LocalDateTime timestamp;
    private String messageText;

    public Message(Long senderId, String messageText) {
        this.senderId = senderId;
        this.messageText = messageText;
        this.timestamp = LocalDateTime.now();
    }
}
