package com.floatflow.service;

import com.floatflow.dto.request.ExpenseDecisionEmailRequest;
import com.floatflow.dto.request.PendingApprovalReminderRequest;
import com.floatflow.dto.response.EmailDispatchResponse;
import com.floatflow.entity.Expense;
import com.floatflow.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${floatflow.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${floatflow.mail.from:no-reply@floatflow.local}")
    private String fromAddress;

    public EmailDispatchResponse sendExpenseSubmittedEmail(Expense expense, User submittedBy, List<User> recipients) {
        Set<String> recipientEmails = recipients.stream()
                .map(User::getEmail)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        String subject = "New FloatFlow expense awaiting approval";
        String body = String.format(
                "A new expense has been submitted for approval.%n%nExpense ID: %d%nSubmitter: %s%nAmount: KES %s%nCategory: %s%nBranch: %s%nDescription: %s%n%nOpen FloatFlow to review this request.",
                expense.getId(),
                submittedBy.getName(),
                expense.getAmount(),
                expense.getCategory(),
                expense.getBranch().getName(),
                expense.getDescription()
        );

        return sendEmail(recipientEmails, subject, body, "expense submission");
    }

    public EmailDispatchResponse sendExpenseDecisionEmail(Expense expense, User approver, String decision, String comment) {
        String subject = "FloatFlow expense " + decision.toLowerCase();
        String body = String.format(
                "Your expense request has been %s.%n%nExpense ID: %d%nApproved By: %s%nAmount: KES %s%nBranch: %s%nCategory: %s%nDescription: %s%nComment: %s%n%nOpen FloatFlow for the latest status.",
                decision.toLowerCase(),
                expense.getId(),
                approver.getName(),
                expense.getAmount(),
                expense.getBranch().getName(),
                expense.getCategory(),
                expense.getDescription(),
                comment == null || comment.isBlank() ? "No comment provided" : comment
        );

        return sendEmail(Set.of(expense.getSubmittedBy().getEmail()), subject, body, "expense decision");
    }

    public EmailDispatchResponse sendExpenseDecisionEmail(ExpenseDecisionEmailRequest request) {
        String subject = "FloatFlow expense " + request.getStatus().toLowerCase();
        String body = String.format(
                "Your expense request has been %s.%n%nExpense ID: %d%nReviewed By: %s%nAmount: KES %s%nBranch: %s%nCategory: %s%nDescription: %s%nComment: %s%n%nOpen FloatFlow for the latest status.",
                request.getStatus().toLowerCase(),
                request.getExpenseId(),
                request.getReviewerName(),
                request.getAmount(),
                request.getBranchName(),
                request.getCategory(),
                request.getDescription(),
                request.getComment() == null || request.getComment().isBlank() ? "No comment provided" : request.getComment()
        );

        return sendEmail(Set.of(request.getSubmittedByEmail()), subject, body, "expense decision");
    }

    public EmailDispatchResponse sendPendingApprovalReminder(PendingApprovalReminderRequest request) {
        Set<String> recipientEmails = request.getExpenses().stream()
                .map(PendingApprovalReminderRequest.PendingApprovalExpenseItem::getSubmittedByEmail)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        StringBuilder body = new StringBuilder();
        body.append("FloatFlow pending approval reminder")
                .append(System.lineSeparator())
                .append(System.lineSeparator())
                .append("Requested By: ").append(request.getRequestedByName()).append(System.lineSeparator())
                .append("Pending Count: ").append(request.getPendingCount()).append(System.lineSeparator())
                .append(System.lineSeparator())
                .append("Pending Expenses:").append(System.lineSeparator());

        for (PendingApprovalReminderRequest.PendingApprovalExpenseItem expense : request.getExpenses()) {
            body.append("- Expense #")
                    .append(expense.getId())
                    .append(" | ")
                    .append(expense.getSubmittedByName())
                    .append(" | KES ")
                    .append(expense.getAmount())
                    .append(" | ")
                    .append(expense.getBranchName())
                    .append(" | Submitted ")
                    .append(expense.getCreatedAt())
                    .append(System.lineSeparator());
        }

        body.append(System.lineSeparator()).append("Please log in to FloatFlow to review pending approvals.");

        return sendEmail(recipientEmails, "FloatFlow pending approval reminder", body.toString(), "pending approval reminder");
    }

    public EmailDispatchResponse sendPasswordResetEmail(User user, String resetUrl) {
        String subject = "Reset your FloatFlow password";
        String body = String.format(
                "Hi %s,%n%nWe received a request to reset your FloatFlow password.%n%nUse this link to set a new password:%n%s%n%nThis link expires in 60 minutes. If you did not request a password reset, you can ignore this email.",
                user.getName(),
                resetUrl
        );

        return sendEmail(Set.of(user.getEmail()), subject, body, "password reset");
    }

    private EmailDispatchResponse sendEmail(Set<String> recipients, String subject, String body, String emailType) {
        if (recipients.isEmpty()) {
            return EmailDispatchResponse.builder()
                    .delivered(false)
                    .queued(true)
                    .message("No recipients available; email queued for later handling")
                    .build();
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (!mailEnabled || mailSender == null) {
            log.info("Mail disabled or unavailable; queued {} email for recipients {}", emailType, recipients);
            return EmailDispatchResponse.builder()
                    .delivered(false)
                    .queued(true)
                    .message("Mail delivery is disabled; email request queued in application logs")
                    .build();
        }

        int deliveredCount = 0;
        for (String recipient : recipients) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromAddress);
                message.setTo(recipient);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                deliveredCount++;
            } catch (Exception exception) {
                log.warn("Failed to send {} email to {}", emailType, recipient, exception);
            }
        }

        if (deliveredCount == recipients.size()) {
            return EmailDispatchResponse.builder()
                    .delivered(true)
                    .queued(false)
                    .message("Email sent successfully")
                    .build();
        }

        if (deliveredCount > 0) {
            return EmailDispatchResponse.builder()
                    .delivered(false)
                    .queued(true)
                    .message("Email partially delivered; remaining recipients were queued in logs")
                    .build();
        }

        return EmailDispatchResponse.builder()
                .delivered(false)
                .queued(true)
                .message("Email delivery failed; request queued in application logs")
                .build();
    }
}
