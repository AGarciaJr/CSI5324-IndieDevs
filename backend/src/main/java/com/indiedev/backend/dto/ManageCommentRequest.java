package com.indiedev.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ManageCommentRequest {
    private boolean hide = false;
    private boolean report = false;
    private String reportReason;
    private boolean blockUser = false;
    private String blockReason;
}
