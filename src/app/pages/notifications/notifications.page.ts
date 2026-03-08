import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppNotification, User } from '../../core/models/healthcare.models';
import { AuthService } from '../../core/services/auth.service';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';

type NotificationFilter = 'all' | 'unread' | 'appointment' | 'billing' | 'message' | 'system';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.scss'
})
export class NotificationsPageComponent implements OnInit {
  protected currentUser: User | null = null;
  protected readonly notifications: AppNotification[] = [];
  protected readonly filteredNotifications: AppNotification[] = [];
  protected selectedFilter: NotificationFilter = 'all';
  protected isLoading = true;
  protected statusMessage = '';
  protected errorMessage = '';

  protected unreadCount = 0;
  protected highPriorityCount = 0;
  protected dueSoonCount = 0;

  constructor(
    private readonly authService: AuthService,
    private readonly healthcareDataService: HealthcareDataService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (!user) {
      this.errorMessage = 'Notifications are unavailable without an active session.';
      this.isLoading = false;
      return;
    }

    this.currentUser = user;
    this.healthcareDataService.syncRemindersForUser(user.id, user.role);

    this.healthcareDataService.getNotificationsForUser(user.id, user.role).subscribe((notifications) => {
      this.notifications.splice(0, this.notifications.length, ...notifications);
      this.refreshSummary();
      this.applyFilter(this.selectedFilter);
      this.isLoading = false;
    });
  }

  protected applyFilter(filter: NotificationFilter): void {
    this.selectedFilter = filter;
    this.filteredNotifications.splice(
      0,
      this.filteredNotifications.length,
      ...this.notifications.filter((notification) => {
        if (filter === 'all') {
          return true;
        }

        if (filter === 'unread') {
          return !notification.read;
        }

        return notification.category === filter;
      })
    );
  }

  protected markAsRead(notificationId: string): void {
    if (!this.currentUser) {
      return;
    }

    try {
      this.healthcareDataService.markNotificationRead(notificationId, this.currentUser.id, this.currentUser.role);
      this.statusMessage = 'Notification marked as read.';
      this.errorMessage = '';
    } catch {
      this.errorMessage = 'Notification could not be updated.';
      this.statusMessage = '';
    }
  }

  protected markAllAsRead(): void {
    if (!this.currentUser) {
      return;
    }

    const count = this.healthcareDataService.markAllNotificationsRead(this.currentUser.id, this.currentUser.role);
    this.statusMessage = count ? `Marked ${count} notifications as read.` : 'No unread notifications found.';
    this.errorMessage = '';
  }

  protected snoozeNotification(notificationId: string): void {
    if (!this.currentUser) {
      return;
    }

    try {
      this.healthcareDataService.snoozeNotification(notificationId, this.currentUser.id, this.currentUser.role, 90);
      this.statusMessage = 'Reminder snoozed for 90 minutes.';
      this.errorMessage = '';
    } catch {
      this.errorMessage = 'Reminder could not be snoozed.';
      this.statusMessage = '';
    }
  }

  protected formatTimestamp(notification: AppNotification): string {
    return new Date(notification.remindAt ?? notification.createdAt).toLocaleString();
  }

  protected isDueSoon(notification: AppNotification): boolean {
    const timestamp = new Date(notification.remindAt ?? notification.createdAt).getTime();
    const now = Date.now();
    return timestamp >= now && timestamp <= now + 2 * 60 * 60 * 1000;
  }

  private refreshSummary(): void {
    this.unreadCount = this.notifications.filter((notification) => !notification.read).length;
    this.highPriorityCount = this.notifications.filter((notification) => notification.priority === 'high').length;
    this.dueSoonCount = this.notifications.filter((notification) => this.isDueSoon(notification)).length;
  }
}
