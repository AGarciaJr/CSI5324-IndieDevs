package com.indiedev.backend.conversation;

import com.indiedev.backend.model.Conversation;
import com.indiedev.backend.repository.ConversationRepository;
import com.indiedev.backend.repository.MessageRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
@AutoConfigureMockMvc
class ConversationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Test
    @DisplayName("POST /api/conversations/send - sends message and creates conversation if not exists")
    void testSendMessageAndCreateConversation() throws Exception {
        String json = """
                {
                    "senderId": 1,
                    "senderName": "Nicholas Nolen",
                    "recipientName": "The Riverbeds",
                    "messageText": "Hello Riverbeds! Huge fan of your new indie track."
                }
                """;

        mockMvc.perform(post("/api/conversations/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.senderId").value(1))
                .andExpect(jsonPath("$.recipientName").value("The Riverbeds"))
                .andExpect(jsonPath("$.messageText").value("Hello Riverbeds! Huge fan of your new indie track."));

        // Verify conversation was created or updated in DB
        Conversation conv = conversationRepository.findByUserPair(1L, 2L).orElse(null);
        assertNotNull(conv, "Conversation should exist in DB");
        assertEquals("Hello Riverbeds! Huge fan of your new indie track.", conv.getLastMessageText());
    }

    @Test
    @DisplayName("GET /api/conversations/user/{userId} - retrieves conversations with message history")
    void testGetConversationsForUser() throws Exception {
        mockMvc.perform(get("/api/conversations/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].messages", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/conversations/{conversationId}/messages - retrieves message list")
    void testGetMessagesForConversation() throws Exception {
        mockMvc.perform(get("/api/conversations/1/messages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].messageText", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/conversations/recipients - searches recipients by name or handle")
    void testSearchRecipients() throws Exception {
        mockMvc.perform(get("/api/conversations/recipients").param("query", "River"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].displayName", containsStringIgnoringCase("River")));
    }
}
