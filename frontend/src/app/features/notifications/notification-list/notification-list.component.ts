import { Component, inject, OnInit, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Notification } from '../../../core/models';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatChipsModule,
  ],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss'],
})
export class NotificationListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  totalElements = signal(0);
  loading = signal(true);

  userRole = this.authService.userRole;
  pageIndex = 0;
  pageSize = 10;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.pageIndex),
      size: String(this.pageSize),
    };
    this.apiService.get<{ content: Notification[]; totalElements: number }>('/notifications', params).subscribe({
      next: (res) => {
        this.notifications.set(res.content);
        this.totalElements.set(res.totalElements);
        this.unreadCount.set(res.content.filter(n => !n.isRead).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadNotifications();
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }
    this.apiService.put(`/notifications/${notification.id}/read`, {}).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === notification.id ? { ...n, isRead: true } : n),
        );
        this.unreadCount.update(c => c - 1);
      },
      error: () => {
        this.snackBar.open('Failed to mark as read', 'Close', { duration: 3000 });
      },
    });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'OVERDUE': return 'warning';
      case 'RESERVATION_READY': return 'event_available';
      case 'RESERVATION_EXPIRED': return 'event_busy';
      default: return 'notifications';
    }
  }

  getTypeChipColor(type: string): string {
    switch (type) {
      case 'OVERDUE': return 'warn';
      case 'RESERVATION_READY': return 'accent';
      case 'RESERVATION_EXPIRED': return '';
      default: return 'primary';
    }
  }
}
