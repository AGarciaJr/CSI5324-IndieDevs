package com.indiedev.backend.repository;

import com.indiedev.backend.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("select c from Conversation c where c.id = :id")
    Conversation findByConversationId(@Param("id") Long id);

    @Query("select c from Conversation c where (c.user1Id = :u1 and c.user2Id = :u2) or (c.user1Id = :u2 and c.user2Id = :u1)")
    Optional<Conversation> findByUserPair(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("select c from Conversation c where c.user1Id = ?1 and c.user2Id = ?2")
    Conversation findByUserIds(Long user1Id, Long user2Id);

    @Query("select c from Conversation c where c.user1Id = :userId or c.user2Id = :userId order by coalesce(c.lastMessageAt, '1970-01-01') desc")
    List<Conversation> findByUserId(@Param("userId") Long userId);
}
