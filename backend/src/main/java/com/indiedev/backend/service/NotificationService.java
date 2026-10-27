package com.indiedev.backend.service;

import com.indiedev.backend.model.Notification;
import com.indiedev.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification notify(Long recipientId, String message) {
        return notificationRepository.save(new Notification(recipientId, message));
    }

    public List<Notification> getNotifications(Long recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

}
