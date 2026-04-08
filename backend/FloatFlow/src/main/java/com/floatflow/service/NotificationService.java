package com.floatflow.service;

import com.floatflow.entity.Notification;
import com.floatflow.entity.Role;
import com.floatflow.entity.User;
import com.floatflow.repository.NotificationRepository;
import com.floatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Send notification to a specific user (simple 2-arg overload).
     */
    @Transactional
    public void notifyUser(Long userId, String message) {
        notifyUser(userId, null, null, message, null);
    }

    /**
     * Send a rich notification to a specific user.
     * Future: Also push via WebSocket here.
     */
    @Transactional
    public void notifyUser(Long userId, String type, String title, String message, String link) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .build();
        notificationRepository.save(notification);

        // TODO: Push via WebSocket — socketService.sendToUser(userId, notification);
        log.debug("Notification sent to user {}: {}", userId, message);
    }

    /**
     * Notify all branch managers for a given branch (simple 2-arg overload).
     */
    @Transactional
    public void notifyBranchManagers(Long branchId, String message) {
        notifyBranchManagers(branchId, null, null, message, null);
    }

    /**
     * Notify all branch managers for a given branch with rich notification data.
     */
    @Transactional
    public void notifyBranchManagers(Long branchId, String type, String title, String message, String link) {
        List<User> managers = getBranchManagers(branchId);

        managers.forEach(manager -> notifyUser(manager.getId(), type, title, message, link));
    }

    @Transactional(readOnly = true)
    public List<User> getBranchManagers(Long branchId) {
        return userRepository.findByRoleAndBranchId(Role.BRANCH_MANAGER, branchId);
    }

    public List<Notification> getMyNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Marks every unread notification for a user as read in one batch.
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}