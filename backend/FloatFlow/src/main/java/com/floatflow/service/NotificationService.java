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
     * Send notification to a specific user.
     * Future: Also push via WebSocket here.
     */
    @Transactional
    public void notifyUser(Long userId, String message) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .build();
        notificationRepository.save(notification);

        // TODO: Push via WebSocket — socketService.sendToUser(userId, message);
        log.debug("Notification sent to user {}: {}", userId, message);
    }

    /**
     * Notify all branch managers for a given branch.
     */
    @Transactional
    public void notifyBranchManagers(Long branchId, String message) {
        List<User> managers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.BRANCH_MANAGER
                        && u.getBranch() != null
                        && u.getBranch().getId().equals(branchId))
                .toList();

        managers.forEach(manager -> notifyUser(manager.getId(), message));
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