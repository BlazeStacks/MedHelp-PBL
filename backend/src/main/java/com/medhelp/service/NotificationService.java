package com.medhelp.service;

import com.medhelp.domain.entity.Notification;
import com.medhelp.domain.entity.User;
import com.medhelp.domain.enums.NotificationType;
import com.medhelp.dto.ActivityDtos;
import com.medhelp.exception.ApiException;
import com.medhelp.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Creates and reads simple in-app notifications. */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void notify(User recipient, NotificationType type, String title, String message, String link) {
        if (recipient == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLink(link);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public ActivityDtos.NotificationSummary summaryFor(Long userId) {
        List<ActivityDtos.NotificationDto> items = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(100)
                .map(this::toDto)
                .toList();
        long unread = notificationRepository.countByUserIdAndReadFalse(userId);
        return new ActivityDtos.NotificationSummary(unread, items);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!notification.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("This notification does not belong to you");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notifications.stream().filter(n -> !n.isRead()).forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    private ActivityDtos.NotificationDto toDto(Notification notification) {
        return new ActivityDtos.NotificationDto(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getLink(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}