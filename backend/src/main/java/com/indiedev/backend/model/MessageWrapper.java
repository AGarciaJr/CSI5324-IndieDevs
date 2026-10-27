package com.indiedev.backend.model;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class MessageWrapper {

    private UserWrapper userWrapper;
    private Message message;

    public MessageWrapper(UserWrapper userWrapper, Message message) {
        this.userWrapper = userWrapper;
        this.message = message;
    }

}
