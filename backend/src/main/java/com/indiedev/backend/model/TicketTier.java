package com.indiedev.backend.model;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/* One ticket option for an event, such as "General admission" or "VIP". */
@Embeddable
@Getter
@Setter
public class TicketTier {

    private String name;
    private BigDecimal price;

    public TicketTier() {
    }

    public TicketTier(String name, BigDecimal price) {
        this.name = name;
        this.price = price;
    }

}
