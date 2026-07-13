import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast.service';
import type { Notification } from '../../../core/models';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h1 class="font-display text-2xl font-extrabold text-ink">Notifications</h1>
          @if (unreadCount() > 0) {
            <span class="badge badge-danger">{{ unreadCount() }} unread</span>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-ink/15 border-t-ink"></div>
        </div>
      } @else if (notifications().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">&#x1F514;</div>
          <h3 class="empty-state-title">No notifications</h3>
          <p class="empty-state-text">You're all caught up.</p>
        </div>
      } @else {
        <div class="flex flex-col gap-2">
          @for (n of notifications(); track n.id) {
            <div class="card !p-4 cursor-pointer transition-colors hover:bg-page group"
                 [class.!border-r-0]="!n.isRead"
                 [class.bg-surface]="true"
                 [class.opacity-60]="n.isRead"
                 (click)="markAsRead(n)">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm leading-relaxed"
                     [class.font-semibold]="!n.isRead"
                     [class.text-ink]="!n.isRead"
                     [class.text-ink-light]="n.isRead">
                    {{ n.message }}
                  </p>
                  <p class="text-xs text-ink-muted mt-1.5 flex items-center gap-2">
                    <span class="badge" [ngClass]="getTypeBadgeClass(n.type)">{{ n.type | titlecase }}</span>
                    {{ n.createdDate | date:'medium' }}
                  </p>
                </div>
                @if (!n.isRead) {
                  <div class="flex-shrink-0 mt-1 flex gap-2">
                    <span class="w-2 h-2 rounded-full bg-accent" title="Unread"></span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        @if (totalElements() > pageSize) {
          <div class="flex items-center justify-center gap-2">
            <button class="btn btn-ghost btn-sm" [disabled]="pageIndex === 0" (click)="goToPage(0)">First</button>
            <button class="btn btn-ghost btn-sm" [disabled]="pageIndex === 0" (click)="goToPage(pageIndex - 1)">Prev</button>
            <span class="text-sm text-ink-muted px-2">Page {{ pageIndex + 1 }} of {{ totalPages() }}</span>
            <button class="btn btn-ghost btn-sm" [disabled]="pageIndex + 1 >= totalPages()" (click)="goToPage(pageIndex + 1)">Next</button>
            <button class="btn btn-ghost btn-sm" [disabled]="pageIndex + 1 >= totalPages()" (click)="goToPage(totalPages() - 1)">Last</button>
          </div>
        }
      }
    </div>
  `,
})
export class NotificationListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

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

  goToPage(page: number): void {
    this.pageIndex = page;
    this.loadNotifications();
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements() / this.pageSize));
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
        this.toastService.show('Failed to mark as read', 'error');
      },
    });
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'OVERDUE': return 'badge-danger';
      case 'RESERVATION_READY': return 'badge-success';
      case 'RESERVATION_EXPIRED': return 'badge-neutral';
      default: return 'badge-info';
    }
  }
}
