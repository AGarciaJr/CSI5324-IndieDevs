/* The service sitting between the message/conversation api and the conversation repository
 */

package com.indiedev.backend.service;

import com.indiedev.backend.dto.RecipientDTO;
import com.indiedev.backend.dto.SendMessageRequest;
import com.indiedev.backend.model.*;
import com.indiedev.backend.repository.ArtistRepository;
import com.indiedev.backend.repository.ConversationRepository;
import com.indiedev.backend.repository.MessageRepository;
import com.indiedev.backend.repository.UserAccountRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserAccountRepository userAccountRepository;
    private final ArtistRepository artistRepository;

    public ConversationService(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            UserAccountRepository userAccountRepository,
            ArtistRepository artistRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userAccountRepository = userAccountRepository;
        this.artistRepository = artistRepository;
    }

    public Conversation getOrCreateConversation(Long u1Id, String u1Name, Long u2Id, String u2Name) {
        Optional<Conversation> existing = conversationRepository.findByUserPair(u1Id, u2Id);
        if (existing.isPresent()) {
            Conversation c = existing.get();
            if (u1Name != null && !u1Name.isBlank()) {
                if (c.getUser1Id().equals(u1Id)) c.setUser1Name(u1Name);
                else if (c.getUser2Id().equals(u1Id)) c.setUser2Name(u1Name);
            }
            if (u2Name != null && !u2Name.isBlank()) {
                if (c.getUser1Id().equals(u2Id)) c.setUser1Name(u2Name);
                else if (c.getUser2Id().equals(u2Id)) c.setUser2Name(u2Name);
            }
            return conversationRepository.save(c);
        }

        Conversation newConv = new Conversation(u1Id, u1Name, u2Id, u2Name);
        return conversationRepository.save(newConv);
    }

    public List<Conversation> getConversationsForUser(Long userId) {
        List<Conversation> list = conversationRepository.findByUserId(userId);
        for (Conversation c : list) {
            List<Message> msgs = messageRepository.findByConversationIdOrderByTimestampAsc(c.getId());
            c.setMessages(msgs);
        }
        return list;
    }

    public List<Message> getMessagesForConversation(Long conversationId) {
        return messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
    }

    public Message sendMessage(SendMessageRequest req) {
        if (req.getMessageText() == null || req.getMessageText().trim().isEmpty()) {
            throw new IllegalArgumentException("Message text cannot be empty.");
        }

        Long senderId = req.getSenderId() != null ? req.getSenderId() : 1L;
        String senderName = req.getSenderName();
        if (senderName == null || senderName.isBlank()) {
            senderName = userAccountRepository.findById(senderId)
                    .map(UserAccount::getDisplayName)
                    .orElse("User #" + senderId);
        }

        Long recipientId = req.getRecipientId();
        String recipientName = req.getRecipientName();

        if (recipientId != null && (recipientName == null || recipientName.isBlank())) {
            Optional<UserAccount> acc = userAccountRepository.findById(recipientId);
            if (acc.isPresent()) {
                recipientName = acc.get().getDisplayName();
            } else {
                Artist art = artistRepository.findArtistById(recipientId);
                if (art != null) recipientName = art.getName();
            }
        } else if ((recipientId == null) && recipientName != null && !recipientName.isBlank()) {
            String trimmed = recipientName.trim();
            Optional<UserAccount> acc = userAccountRepository.findByUsernameIgnoreCase(trimmed)
                    .or(() -> userAccountRepository.findByDisplayNameIgnoreCase(trimmed));
            if (acc.isPresent()) {
                recipientId = acc.get().getId();
                recipientName = acc.get().getDisplayName();
            } else {
                List<Artist> artists = artistRepository.search(trimmed, null, null);
                if (!artists.isEmpty()) {
                    recipientId = artists.get(0).getId();
                    recipientName = artists.get(0).getName();
                } else {
                    recipientId = (long) Math.abs(trimmed.hashCode() % 1000 + 10);
                }
            }
        }

        if (recipientId == null) {
            recipientId = 2L;
            recipientName = "The Riverbeds";
        }
        if (recipientName == null || recipientName.isBlank()) {
            recipientName = "Community Member #" + recipientId;
        }

        Conversation conversation = getOrCreateConversation(senderId, senderName, recipientId, recipientName);

        Message message = new Message(
                conversation.getId(),
                senderId,
                senderName,
                recipientId,
                recipientName,
                req.getMessageText().trim()
        );
        message.setTimestamp(LocalDateTime.now());
        Message saved = messageRepository.save(message);

        conversation.setLastMessageText(saved.getMessageText());
        conversation.setLastMessageAt(saved.getTimestamp());
        conversationRepository.save(conversation);

        return saved;
    }

    public List<RecipientDTO> searchRecipients(String query) {
        List<RecipientDTO> results = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        String q = query != null ? query.trim() : "";

        // 1. Artists
        List<Artist> artists = artistRepository.search(q.isEmpty() ? null : q, null, null);
        for (Artist a : artists) {
            String key = "artist-" + a.getId();
            if (seen.add(key)) {
                String initials = Arrays.stream(a.getName().split(" "))
                        .filter(s -> !s.isEmpty())
                        .map(s -> s.substring(0, 1).toUpperCase())
                        .reduce("", (a1, b1) -> a1 + b1);
                if (initials.length() > 2) initials = initials.substring(0, 2);

                results.add(new RecipientDTO(
                        a.getId(),
                        a.getName().toLowerCase().replaceAll("\\s+", "-"),
                        a.getName(),
                        "Artist",
                        initials.isEmpty() ? "AR" : initials,
                        a.getGenre() + " · " + (a.getLocation() != null ? a.getLocation() : "Artist")
                ));
            }
        }

        // 2. User Accounts (Fans & Creators)
        List<UserAccount> accounts = q.isEmpty()
                ? userAccountRepository.findAll()
                : userAccountRepository.findByDisplayNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(q, q);

        for (UserAccount acc : accounts) {
            String key = "user-" + acc.getId();
            if (seen.add(key)) {
                String name = acc.getDisplayName() != null ? acc.getDisplayName() : acc.getUsername();
                String initials = Arrays.stream(name.split(" "))
                        .filter(s -> !s.isEmpty())
                        .map(s -> s.substring(0, 1).toUpperCase())
                        .reduce("", (a1, b1) -> a1 + b1);
                if (initials.length() > 2) initials = initials.substring(0, 2);

                results.add(new RecipientDTO(
                        acc.getId(),
                        acc.getUsername(),
                        name,
                        acc.getRole() != null ? acc.getRole().name() : "Fan",
                        initials.isEmpty() ? "FN" : initials,
                        (acc.getRole() != null ? acc.getRole().name() : "Member") + " · @" + acc.getUsername()
                ));
            }
        }

        return results;
    }

    // Backward-compatible wrappers
    public Conversation saveConversation(UserWrapper userWrapper) {
        Conversation conversation = new Conversation();
        conversation.setUser1Id(userWrapper.getUser(0).getId());
        conversation.setUser1Name(userWrapper.getUser(0).getName());
        conversation.setUser2Id(userWrapper.getUser(1).getId());
        conversation.setUser2Name(userWrapper.getUser(1).getName());
        conversation.setLastMessageAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }

    public Message saveMessage(MessageWrapper messageWrapper) {
        Conversation conversation = getConversationByUsers(messageWrapper.getUserWrapper());
        if (conversation == null) {
            conversation = new Conversation();
            conversation.setUser1Id(messageWrapper.getUserWrapper().getUser(0).getId());
            conversation.setUser1Name(messageWrapper.getUserWrapper().getUser(0).getName());
            conversation.setUser2Id(messageWrapper.getUserWrapper().getUser(1).getId());
            conversation.setUser2Name(messageWrapper.getUserWrapper().getUser(1).getName());
            conversation = conversationRepository.save(conversation);
        }

        Message msg = messageWrapper.getMessage();
        msg.setConversationId(conversation.getId());
        if (msg.getTimestamp() == null) msg.setTimestamp(LocalDateTime.now());
        Message saved = messageRepository.save(msg);

        conversation.setLastMessageText(saved.getMessageText());
        conversation.setLastMessageAt(saved.getTimestamp());
        conversationRepository.save(conversation);

        return saved;
    }

    public List<Conversation> getAllConversations() {
        List<Conversation> list = conversationRepository.findAll();
        for (Conversation c : list) {
            c.setMessages(messageRepository.findByConversationIdOrderByTimestampAsc(c.getId()));
        }
        return list;
    }

    public Conversation getConversationById(Long conversationId) {
        Conversation c = conversationRepository.findByConversationId(conversationId);
        if (c != null) {
            c.setMessages(messageRepository.findByConversationIdOrderByTimestampAsc(conversationId));
        }
        return c;
    }

    public Conversation getConversationByUsers(UserWrapper userWrapper) {
        return conversationRepository.findByUserPair(
                userWrapper.getUser(0).getId(),
                userWrapper.getUser(1).getId()
        ).orElse(null);
    }
}
