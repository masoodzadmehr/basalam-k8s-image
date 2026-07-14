import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast.service';
import type { Reservation } from '../../../core/models';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrl: './reservation-list.component.scss',
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-ink">
            {{ isAllMode ? 'تمام رزروها' : 'رزروهای من' }}
          </h1>
          <p class="text-ink-muted text-sm mt-1">
            {{ isAllMode ? 'مدیریت تمام رزروهای کتابخانه' : 'رزروهای کتاب شما' }}
          </p>
        </div>
        @if (!isAllMode) {
          <a routerLink="/reservations/all" class="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>مشاهده همه</span>
          </a>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-ink/15 border-t-ink"></div>
        </div>
      } @else if (reservations().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="8" y1="14" x2="8" y2="14.01"/>
              <line x1="12" y1="14" x2="12" y2="14.01"/>
              <line x1="16" y1="14" x2="16" y2="14.01"/>
            </svg>
          </div>
          <h3 class="empty-state-title">رزروی یافت نشد</h3>
          <p class="empty-state-text">کتاب‌های رزرو شده اینجا نمایش داده می‌شوند.</p>
        </div>
      } @else {
        <div class="card-flush overflow-hidden hidden md:block">
          <table class="table-root">
            <thead>
              <tr>
                @if (isAllMode) { <th>کاربر</th> }
                <th>کتاب</th>
                <th>تاریخ رزرو</th>
                <th>انقضا</th>
                <th>وضعیت</th>
                <th class="hidden sm:table-cell">عملیات</th>
              </tr>
            </thead>
            <tbody>
              @for (r of reservations(); track r.id) {
                <tr>
                  @if (isAllMode) { <td>{{ r.username }}</td> }
                  <td class="font-medium">{{ r.bookTitle }}</td>
                  <td class="text-ink-muted text-xs">{{ r.reserveDate | date:'yyyy/MM/dd' }}</td>
                  <td [class.text-danger]="r.status === 'EXPIRED'" class="text-xs">
                    {{ r.expiryDate | date:'yyyy/MM/dd' }}
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusBadgeClass(r.status)">
                      {{ getStatusLabel(r.status) }}
                    </span>
                  </td>
                  <td class="hidden sm:table-cell">
                    @if (r.status === 'PENDING') {
                      <button class="btn btn-ghost btn-sm !text-danger hover:!bg-danger-subtle"
                              (click)="cancelReservation(r)">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span>لغو</span>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="md:hidden flex flex-col gap-3">
          @for (r of reservations(); track r.id) {
            <div class="card !p-4">
              @if (isAllMode) {
                <p class="text-xs text-ink-muted mb-1">{{ r.username }}</p>
              }
              <h3 class="font-display font-semibold text-base mb-2">{{ r.bookTitle }}</h3>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted mb-3">
                <span>رزرو: {{ r.reserveDate | date:'yyyy/MM/dd' }}</span>
                <span [class.text-danger]="r.status === 'EXPIRED'">انقضا: {{ r.expiryDate | date:'yyyy/MM/dd' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="badge" [ngClass]="getStatusBadgeClass(r.status)">
                  {{ getStatusLabel(r.status) }}
                </span>
                @if (r.status === 'PENDING') {
                  <button class="btn btn-ghost btn-sm !text-danger" (click)="cancelReservation(r)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>لغو</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        @if (totalElements() > pageSize) {
          <div class="flex items-center justify-center gap-2">
            <button class="btn btn-ghost btn-sm" [disabled]="pageIndex === 0" (click)="goToPage(0)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 rotate-180"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
              <span>اولین</span>
            </button>
            <button class="btn btn-ghost btn-sm" [disabled]="pageIndex === 0" (click)="goToPage(pageIndex - 1)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 rotate-180"><polyline points="15 18 9 12 15 6"/></svg>
              <span>قبلی</span>
            </button>
            <span class="text-sm text-ink-muted px-2">صفحه {{ pageIndex + 1 }} از {{ totalPages() }}</span>
            <button class="btn btn-ghost btn-sm" [disabled]="pageIndex + 1 >= totalPages()" (click)="goToPage(pageIndex + 1)">
              <span>بعدی</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" [disabled]="pageIndex + 1 >= totalPages()" (click)="goToPage(totalPages() - 1)">
              <span>آخرین</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class ReservationListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  reservations = signal<Reservation[]>([]);
  totalElements = signal(0);
  loading = signal(true);
  userRole = this.authService.userRole;

  isAllMode = false;
  pageIndex = 0;
  pageSize = 10;

  ngOnInit(): void {
    this.isAllMode = this.router.url.includes('/all');
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.pageIndex),
      size: String(this.pageSize),
    };
    this.apiService.get<{ content: Reservation[]; totalElements: number }>('/reservations', params).subscribe({
      next: (res) => {
        this.reservations.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPage(page: number): void {
    this.pageIndex = page;
    this.loadReservations();
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements() / this.pageSize));
  }

  cancelReservation(reservation: Reservation): void {
    this.apiService.post(`/reservations/${reservation.id}/cancel`, {}).subscribe({
      next: () => {
        this.toastService.show('رزرو لغو شد', 'success');
        this.loadReservations();
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'خطا در لغو رزرو', 'error');
      },
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'در انتظار';
      case 'FULFILLED': return 'انجام شده';
      case 'CANCELLED': return 'لغو شده';
      case 'EXPIRED': return 'منقضی';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'FULFILLED': return 'badge-success';
      case 'CANCELLED': return 'badge-neutral';
      case 'EXPIRED': return 'badge-info';
      default: return 'badge-neutral';
    }
  }
}
