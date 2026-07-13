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
    <div class="p-4 md:p-6 max-w-2xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <h1 class="font-display text-2xl font-bold text-ink">Notifications</h1>
          @if (unreadCount() > 0) {
            <span class="badge badge-brass">{{ unreadCount() }} unread</span>
          }
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="w-10 h-10 border-[3px] border-parchment border-t-brass rounded-full animate-spin"></div>
        </div>
      }
      @else if (notifications().length === 0) {
        <div class="card text-center py-12 text-slate-light">
          <p class="text-lg mb-2">No notifications</p>
          <p>You're all caught up.</p>
        </div>
      }
      @else {
        <!-- Notification List -->
        <div class="flex flex-col gap-2">
          @for (n of notifications(); track n.id) {
            <div class="card p-4 cursor-pointer transition-colors hover:bg-parchment/20"
                 [class.border-l-[3px]]="!n.isRead"
                 [class.border-l-brass]="!n.isRead"
                 [class.pl-3]="!n.isRead"
                 [class.opacity-70]="n.isRead"
                 (click)="markAsRead(n)">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm" [class.font-semibold]="!n.isRead" [class.font-normal]="n.isRead">
                    {{ n.message }}
                  </p>
                  <p class="text-xs text-slate-light mt-1 flex items-center gap-2">
                    <span class="badge" [ngClass]="getTypeBadgeClass(n.type)">{{ n.type | titlecase }}</span>
                    {{ n.createdDate | date:'medium' }}
                  </p>
                </div>
                @if (!n.isRead) {
                  <span class="w-2 h-2 rounded-full bg-brass flex-shrink-0 mt-1.5" title="Unread"></span>
                }
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalElements() > pageSize) {
          <div class="flex items-center justify-center gap-2 mt-6">
            <button class="btn btn-secondary btn-sm"
                    [disabled]="pageIndex === 0"
                    (click)="goToPage(0)">First</button>
            <button class="btn btn-secondary btn-sm"
                    [disabled]="pageIndex === 0"
                    (click)="goToPage(pageIndex - 1)">Prev</button>
            <span class="text-sm text-slate-light px-2">
              Page {{ pageIndex + 1 }} of {{ totalPages() }}
            </span>
            <button class="btn btn-secondary btn-sm"
                    [disabled]="pageIndex + 1 >= totalPages()"
                    (click)="goToPage(pageIndex + 1)">Next</button>
            <button class="btn btn-secondary btn-sm"
                    [disabled]="pageIndex + 1 >= totalPages()"
                    (click)="goToPage(totalPages() - 1)">Last</button>
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
      case 'OVERDUE': return 'badge-overdue';
      case 'RESERVATION_READY': return 'badge-available';
      case 'RESERVATION_EXPIRED': return 'badge-cancelled';
      default: return 'badge-returned';
    }
  }
}
