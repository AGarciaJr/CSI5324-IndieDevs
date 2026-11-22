package com.indiedev.backend.repository;

import com.indiedev.backend.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderByTimestampAsc(Long conversationId);

    List<Message> findBySenderIdOrRecipientIdOrderByTimestampDesc(Long senderId, Long recipientId);
}
