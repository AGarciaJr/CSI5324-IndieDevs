/* The api for creating and retrieving messages, organized into conversations between two users
 */

package com.indiedev.backend.controller;


import com.indiedev.backend.model.Conversation;
import com.indiedev.backend.model.Message;
import com.indiedev.backend.model.MessageWrapper;
import com.indiedev.backend.model.UserWrapper;
import com.indiedev.backend.service.ConversationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) { this.conversationService = conversationService; }

    // Begin a new conversation between two users
    @PostMapping
    public Conversation saveConversation(@RequestBody UserWrapper userWrapper) {
        return conversationService.saveConversation(userWrapper);
    }

    // Add a message by a given user to an ongoing conversation with another user
    @PostMapping(path = "/messages")
    public Message saveMessage(@RequestBody MessageWrapper messageWrapper) {
        return conversationService.saveMessage(messageWrapper);
    }

    // Get all stored conversations
    @GetMapping
    public List<Conversation> getAllConversations() { return conversationService.getAllConversations(); }

    // Get a conversation object (containing a list of messages) corresponding to a given conversation id
    @GetMapping(path = "/byconversationid/{conversationId}")
    public Conversation getConversation(@PathVariable Long conversationId) {
        return conversationService.getConversationById(conversationId);
    }

    // Get a conversation object given the ids of the users it belongs to
    // TODO

}
