package com.indiedev.backend.repository;

import com.indiedev.backend.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("select c from Conversation c where c.id = ?1")
    Conversation findByConversationId(Long id);

    @Query("select c from Conversation c where c.user1Id = ?1 and c.user2Id = ?2")
    Conversation findByUserIds(Long user1Id, Long user2Id);

}
