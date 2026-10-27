/* An event proposed by an artist. New events wait in PENDING_APPROVAL until an admin
 * reviews the pricing (a separate use case), or stay in DRAFT if the artist is not done yet.
 */

package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
@Getter
@Setter
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long artistId;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private LocalDateTime startsAt;

    // A street address, or a meeting link when the event is virtual
    private String location;
    private boolean virtual;

    private Integer capacity;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_ticket_tiers", joinColumns = @JoinColumn(name = "event_id"))
    private List<TicketTier> ticketTiers = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status;

    private LocalDateTime createdAt;

    public Event() {
        createdAt = LocalDateTime.now();
    }

}
