/* An event proposed by an artist. New events wait in PENDING_APPROVAL until an admin
 * reviews the pricing, or stay in DRAFT if the artist is not done yet.
 */

package com.indiedev.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    private String eventType = "Concert";

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    private LocalDateTime startsAt;

    // A street address, or a meeting link when the event is virtual
    private String location;

    private Boolean virtual = false;

    private Integer capacity;

    private String imageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_ticket_tiers", joinColumns = @JoinColumn(name = "event_id"))
    private List<TicketTier> ticketTiers = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.DRAFT;

    private Boolean reviewedAcknowledgment = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Event() {
        this.createdAt = LocalDateTime.now();
        this.status = EventStatus.DRAFT;
        this.virtual = false;
        this.reviewedAcknowledgment = false;
        this.ticketTiers = new ArrayList<>();
    }

    public Event(Long id, Long artistId, String eventType, String title, String description,
                 LocalDateTime startsAt, String location, Boolean virtual, Integer capacity,
                 String imageUrl, List<TicketTier> ticketTiers, EventStatus status,
                 Boolean reviewedAcknowledgment, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.artistId = artistId;
        this.eventType = eventType;
        this.title = title;
        this.description = description;
        this.startsAt = startsAt;
        this.location = location;
        this.virtual = virtual != null ? virtual : false;
        this.capacity = capacity;
        this.imageUrl = imageUrl;
        this.ticketTiers = ticketTiers != null ? new ArrayList<>(ticketTiers) : new ArrayList<>();
        this.status = status != null ? status : EventStatus.DRAFT;
        this.reviewedAcknowledgment = reviewedAcknowledgment != null ? reviewedAcknowledgment : false;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    public boolean isVirtual() {
        return virtual != null && virtual;
    }

    public void setVirtual(Boolean virtual) {
        this.virtual = virtual != null ? virtual : false;
    }

    public void setVirtual(boolean virtual) {
        this.virtual = virtual;
    }

    public boolean isReviewedAcknowledgment() {
        return reviewedAcknowledgment != null && reviewedAcknowledgment;
    }

    public void setReviewedAcknowledgment(Boolean reviewedAcknowledgment) {
        this.reviewedAcknowledgment = reviewedAcknowledgment != null ? reviewedAcknowledgment : false;
    }

    public void setReviewedAcknowledgment(boolean reviewedAcknowledgment) {
        this.reviewedAcknowledgment = reviewedAcknowledgment;
    }

    @JsonProperty("eventDate")
    public LocalDateTime getEventDate() {
        return startsAt;
    }

    @JsonProperty("eventDate")
    public void setEventDate(LocalDateTime eventDate) {
        this.startsAt = eventDate;
    }

    public void setStatus(EventStatus status) {
        this.status = status != null ? status : EventStatus.DRAFT;
    }

    public void setStatus(String statusStr) {
        this.status = EventStatus.fromString(statusStr);
    }

    public void setTicketTiers(List<TicketTier> ticketTiers) {
        this.ticketTiers = ticketTiers != null ? new ArrayList<>(ticketTiers) : new ArrayList<>();
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = EventStatus.DRAFT;
        }
        if (virtual == null) {
            virtual = false;
        }
        if (reviewedAcknowledgment == null) {
            reviewedAcknowledgment = false;
        }
        if (ticketTiers == null) {
            ticketTiers = new ArrayList<>();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
