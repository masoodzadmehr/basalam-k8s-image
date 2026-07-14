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
  styleUrl: './notification-list.component.scss',
  template: `
    <div class="notifications">
      <div class="notifications__header">
        <div class="notifications__title-row">
          <h1 class="notifications__title">&#x200F;&#x627;&#x639;&#x644;&#x627;&#x646;&#x200C;&#x647;&#x627;</h1>
          @if (unreadCount() > 0) {
            <span class="notifications__unread-badge">{{ unreadCount() }} &#x62E;&#x648;&#x627;&#x646;&#x62F;&#x647; &#x646;&#x634;&#x62F;&#x647;</span>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="notifications__loading">
          <div class="notifications__spinner"></div>
        </div>
      } @else if (notifications().length === 0) {
        <div class="notifications__empty">
          <div class="notifications__empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <h3 class="notifications__empty-title">&#x200F;&#x627;&#x639;&#x644;&#x627;&#x646;&#x6CC; &#x648;&#x62C;&#x648;&#x62F; &#x646;&#x62F;&#x627;&#x631;&#x62F;</h3>
          <p class="notifications__empty-text">&#x200F;&#x647;&#x645;&#x647; &#x627;&#x639;&#x644;&#x627;&#x646;&#x200C;&#x647;&#x627; &#x631;&#x627; &#x645;&#x634;&#x627;&#x647;&#x62F;&#x647; &#x6A9;&#x631;&#x62F;&#x647;&#x200C;&#x627;&#x6CC;&#x62F;.</p>
        </div>
      } @else {
        <div class="notifications__list">
          @for (n of notifications(); track n.id) {
            <div class="notifications__item"
                 [class.notifications__item--read]="n.isRead"
                 [class.notifications__item--unread]="!n.isRead"
                 (click)="markAsRead(n)">
              <div class="notifications__item-inner">
                <div class="notifications__item-content">
                  <p class="notifications__item-message"
                     [class.notifications__item-message--bold]="!n.isRead">
                    {{ n.message }}
                  </p>
                  <p class="notifications__item-meta">
                    <span class="notifications__type-badge"
                          [class.notifications__type-badge--overdue]="n.type === 'OVERDUE'"
                          [class.notifications__type-badge--ready]="n.type === 'RESERVATION_READY'"
                          [class.notifications__type-badge--expired]="n.type === 'RESERVATION_EXPIRED'"
                          [class.notifications__type-badge--info]="n.type !== 'OVERDUE' && n.type !== 'RESERVATION_READY' && n.type !== 'RESERVATION_EXPIRED'">
                      @if (n.type === 'OVERDUE') {
                        &#x200F;&#x62F;&#x6CC;&#x631;&#x6A9;&#x631;&#x62F;
                      } @else if (n.type === 'RESERVATION_READY') {
                        &#x200F;&#x622;&#x645;&#x627;&#x62F;&#x647; &#x631;&#x632;&#x631;&#x648;
                      } @else if (n.type === 'RESERVATION_EXPIRED') {
                        &#x200F;&#x631;&#x632;&#x631;&#x648; &#x645;&#x646;&#x642;&#x636;&#x6CC;
                      } @else {
                        &#x200F;&#x639;&#x645;&#x648;&#x645;&#x6CC;
                      }
                    </span>
                    {{ n.createdDate | date:'medium' }}
                  </p>
                </div>
                @if (!n.isRead) {
                  <div class="notifications__dot" title="&#x62E;&#x648;&#x627;&#x646;&#x62F;&#x647; &#x646;&#x634;&#x62F;&#x647;"></div>
                }
              </div>
            </div>
          }
        </div>

        @if (totalElements() > pageSize) {
          <div class="notifications__pagination">
            <button class="notifications__page-btn" [disabled]="pageIndex === 0" (click)="goToPage(0)">&#x627;&#x648;&#x644;&#x6CC;&#x646;</button>
            <button class="notifications__page-btn" [disabled]="pageIndex === 0" (click)="goToPage(pageIndex - 1)">&#x642;&#x628;&#x644;&#x6CC;</button>
            <span class="notifications__page-info">&#x635;&#x641;&#x62D;&#x647; {{ pageIndex + 1 }} &#x627;&#x632; {{ totalPages() }}</span>
            <button class="notifications__page-btn" [disabled]="pageIndex + 1 >= totalPages()" (click)="goToPage(pageIndex + 1)">&#x628;&#x639;&#x62F;&#x6CC;</button>
            <button class="notifications__page-btn" [disabled]="pageIndex + 1 >= totalPages()" (click)="goToPage(totalPages() - 1)">&#x622;&#x62E;&#x631;&#x6CC;&#x646;</button>
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
