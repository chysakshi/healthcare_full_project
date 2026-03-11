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
  protected readonly pagedNotifications: AppNotification[] = [];
  protected selectedFilter: NotificationFilter = 'all';
  protected searchQuery = '';
  protected currentPage = 1;
  protected readonly pageSize = 4;
  protected totalPages = 1;
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
      this.refreshNotificationView();
      this.isLoading = false;
    });
  }

  protected applyFilter(filter: NotificationFilter): void {
    this.selectedFilter = filter;
    this.currentPage = 1;
    this.refreshNotificationView();
  }

  protected applySearch(): void {
    this.currentPage = 1;
    this.refreshNotificationView();
  }

  protected previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage -= 1;
    this.refreshPagination();
  }

  protected nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage += 1;
    this.refreshPagination();
  }

  private refreshNotificationView(): void {
    const normalizedQuery = this.searchQuery.trim().toLowerCase();

    this.filteredNotifications.splice(
      0,
      this.filteredNotifications.length,
      ...this.notifications.filter((notification) => {
        const matchesQuery =
          !normalizedQuery ||
          notification.title.toLowerCase().includes(normalizedQuery) ||
          notification.body.toLowerCase().includes(normalizedQuery) ||
          notification.category.toLowerCase().includes(normalizedQuery) ||
          notification.priority.toLowerCase().includes(normalizedQuery);

        if (this.selectedFilter === 'all') {
          return matchesQuery;
        }

        if (this.selectedFilter === 'unread') {
          return !notification.read && matchesQuery;
        }

        return notification.category === this.selectedFilter && matchesQuery;
      })
    );

    this.refreshPagination();
  }

  private refreshPagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredNotifications.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedNotifications.splice(
      0,
      this.pagedNotifications.length,
      ...this.filteredNotifications.slice(startIndex, endIndex)
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
