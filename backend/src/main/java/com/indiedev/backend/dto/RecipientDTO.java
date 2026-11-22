package com.indiedev.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecipientDTO {
    private Long id;
    private String username;
    private String displayName;
    private String role;
    private String avatar;
    private String description;
}
