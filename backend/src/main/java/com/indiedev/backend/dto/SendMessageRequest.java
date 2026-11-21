package com.indiedev.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    private Long senderId;
    private String senderName;
    private Long recipientId;
    private String recipientName;
    private String messageText;
}
