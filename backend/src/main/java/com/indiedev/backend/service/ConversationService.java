/* The service sitting between the message/conversation api and the conversation repository
 */

package com.indiedev.backend.service;

import com.indiedev.backend.model.Conversation;
import com.indiedev.backend.model.Message;
import com.indiedev.backend.model.MessageWrapper;
import com.indiedev.backend.model.UserWrapper;
import com.indiedev.backend.repository.ConversationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;

    public ConversationService(ConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;
    }

    // Given a wrapper object that contains two users, create a new conversation object for them
    public Conversation saveConversation(UserWrapper userWrapper) {
        Conversation conversation = new Conversation();
        conversation.setUser1Id(userWrapper.getUser(0).getId());
        conversation.setUser2Id(userWrapper.getUser(1).getId());
        return conversationRepository.save(conversation);
    }

    // Given a wrapper object that contains a sender, a recipient, and message text,
    // add a message to an existing conversation
    public Message saveMessage(MessageWrapper messageWrapper) {
        Conversation conversation = getConversationByUsers(messageWrapper.getUserWrapper());
        conversation.addMessage(messageWrapper.getMessage());
        return messageWrapper.getMessage();
    }

    // Return all stored conversations
    public List<Conversation> getAllConversations() { return conversationRepository.findAll(); }

    // Given a conversation id, return the corresponding conversation
    public Conversation getConversationById(Long conversationId) {
        return conversationRepository.findByConversationId(conversationId);
    }

    // Given a wrapper of two users, return the conversation between them (if it exists)
    public Conversation getConversationByUsers(UserWrapper userWrapper) {
        return conversationRepository.findByUserIds(
                userWrapper.getUser(0).getId(),
                userWrapper.getUser(1).getId()
        );
    }

}
