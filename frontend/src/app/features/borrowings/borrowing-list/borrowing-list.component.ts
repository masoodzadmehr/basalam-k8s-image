import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast.service';
import type { Borrowing } from '../../../core/models';

@Component({
  selector: 'app-borrowing-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrl: './borrowing-list.component.scss',
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-ink">
            @if (isOverdueMode) {
              امانت‌های دیرکرد
            } @else if (isAllMode) {
              تمام امانت‌ها
            } @else {
              امانت‌های من
            }
          </h1>
          <p class="text-ink-muted text-sm mt-1">
            @if (isOverdueMode) {
              موارد گذشته از موعد تحویل
            } @else if (isAllMode) {
              {{ totalElements() }} امانت
            } @else {
              کتاب‌های در دست امانت شما
            }
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          @if (!isOverdueMode) {
            <select
              class="input-field w-auto min-w-[150px]"
              [value]="statusFilter()"
              (change)="onStatusFilterChange($any($event.target).value)">
              <option value="">همه وضعیت‌ها</option>
              <option value="BORROWED">فعال</option>
              <option value="EXTENDED">تمدید شده</option>
              <option value="RETURNED">برگشتی</option>
            </select>
          }
          <div class="flex gap-1">
            @if (canManageBorrowings() && !isAllMode) {
              <a routerLink="/borrowings/all" class="btn btn-ghost btn-sm">مشاهده همه</a>
            }
            @if (canManageBorrowings() && !isOverdueMode) {
              <a routerLink="/borrowings/overdue" class="btn btn-ghost btn-sm">دیرکرد</a>
            }
          </div>
          <a routerLink="/borrowings/new" class="btn btn-accent btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            <span>امانت</span>
          </a>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-ink/15 border-t-ink"></div>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && borrowings().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              <line x1="8" y1="7" x2="16" y2="7"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
          <h3 class="empty-state-title">امانتی یافت نشد</h3>
          <p class="empty-state-text">امانت‌های فعال اینجا نمایش داده می‌شوند.</p>
        </div>
      }

      <!-- Desktop Table -->
      @if (!loading() && borrowings().length > 0) {
        <div class="card-flush overflow-hidden">
          <table class="table-root">
            <thead>
              <tr>
                @if (isAllMode || isOverdueMode) {
                  <th>کاربر</th>
                }
                <th>کتاب</th>
                <th>تاریخ امانت</th>
                <th>موعد تحویل</th>
                <th>وضعیت</th>
                <th class="hidden sm:table-cell">عملیات</th>
              </tr>
            </thead>
            <tbody>
              @for (b of borrowings(); track b.id) {
                <tr>
                  @if (isAllMode || isOverdueMode) {
                    <td>{{ b.username }}</td>
                  }
                  <td class="font-medium">{{ b.bookTitle }}</td>
                  <td class="text-ink-muted text-xs">{{ b.borrowDate | date:'yyyy/MM/dd' }}</td>
                  <td [class.text-danger]="isOverdueMode || b.status === 'OVERDUE'"
                      class="text-xs">
                    {{ b.dueDate | date:'yyyy/MM/dd' }}
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusBadgeClass(b.status)">
                      {{ getStatusLabel(b.status) }}
                    </span>
                  </td>
                  <td class="hidden sm:table-cell">
                    <div class="flex gap-1">
                      @if (canExtend(b)) {
                        <button class="btn btn-ghost btn-sm" (click)="extendBorrowing(b)">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span>تمدید</span>
                        </button>
                      }
                      @if (canReturn(b)) {
                        <button class="btn btn-accent btn-sm" (click)="returnBook(b)">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                          <span>برگشت</span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Mobile Cards -->
      @if (!loading() && borrowings().length > 0) {
        <div class="sm:hidden flex flex-col gap-3">
          @for (b of borrowings(); track b.id) {
            <div class="card !p-4">
              @if (isAllMode || isOverdueMode) {
                <p class="text-xs text-ink-muted mb-1">{{ b.username }}</p>
              }
              <h3 class="font-display font-semibold text-base mb-2">{{ b.bookTitle }}</h3>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted mb-3">
                <span>امانت: {{ b.borrowDate | date:'yyyy/MM/dd' }}</span>
                <span [class.text-danger]="isOverdueMode || b.status === 'OVERDUE'">
                  تحویل: {{ b.dueDate | date:'yyyy/MM/dd' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="badge" [ngClass]="getStatusBadgeClass(b.status)">
                  {{ getStatusLabel(b.status) }}
                </span>
                <div class="flex gap-1">
                  @if (canExtend(b)) {
                    <button class="btn btn-ghost btn-sm" (click)="extendBorrowing(b)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>تمدید</span>
                    </button>
                  }
                  @if (canReturn(b)) {
                    <button class="btn btn-accent btn-sm" (click)="returnBook(b)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                      <span>برگشت</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Pagination -->
      @if (!loading() && totalElements() > pageSize) {
        <div class="flex items-center justify-center gap-2">
          <button class="btn btn-ghost btn-sm" [disabled]="pageIndex === 0" (click)="goToPage(0)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 rotate-180"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
            <span>اولین</span>
          </button>
          <button class="btn btn-ghost btn-sm" [disabled]="pageIndex === 0" (click)="goToPage(pageIndex - 1)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 rotate-180"><polyline points="15 18 9 12 15 6"/></svg>
            <span>قبلی</span>
          </button>
          <span class="text-sm text-ink-muted tabular-nums px-2">صفحه {{ pageIndex + 1 }} از {{ totalPages() }}</span>
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
    </div>
  `,
})
export class BorrowingListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  borrowings = signal<Borrowing[]>([]);
  totalElements = signal(0);
  loading = signal(true);
  userRole = this.authService.userRole;

  isAllMode = false;
  isOverdueMode = false;
  statusFilter = signal('');

  pageIndex = 0;
  pageSize = 10;

  ngOnInit(): void {
    const url = this.router.url;
    this.isAllMode = url.includes('/all');
    this.isOverdueMode = url.includes('/overdue');
    this.loadBorrowings();
  }

  loadBorrowings(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.pageIndex),
      size: String(this.pageSize),
    };
    if (this.statusFilter()) {
      params['status'] = this.statusFilter();
    }
    let endpoint = '/borrowings';
    if (this.isOverdueMode) {
      endpoint = '/borrowings/overdue';
    }
    this.apiService.get<{ content: Borrowing[]; totalElements: number }>(endpoint, params).subscribe({
      next: (res) => {
        this.borrowings.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  goToPage(page: number): void {
    this.pageIndex = page;
    this.loadBorrowings();
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements() / this.pageSize));
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.pageIndex = 0;
    this.loadBorrowings();
  }

  extendBorrowing(borrowing: Borrowing): void {
    this.apiService.post(`/borrowings/${borrowing.id}/extend`, {}).subscribe({
      next: () => {
        this.toastService.show('امانت تمدید شد!', 'success');
        this.loadBorrowings();
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'خطا در تمدید امانت', 'error');
      },
    });
  }

  returnBook(borrowing: Borrowing): void {
    this.apiService.post(`/borrowings/${borrowing.id}/return`, {}).subscribe({
      next: () => {
        this.toastService.show('کتاب برگشت داده شد!', 'success');
        this.loadBorrowings();
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'خطا در برگشت کتاب', 'error');
      },
    });
  }

  canManageBorrowings(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'BORROWED': return 'فعال';
      case 'EXTENDED': return 'تمدید';
      case 'OVERDUE': return 'دیرکرد';
      case 'RETURNED': return 'برگشتی';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'BORROWED': return 'badge-warning';
      case 'EXTENDED': return 'badge-info';
      case 'OVERDUE': return 'badge-danger';
      case 'RETURNED': return 'badge-success';
      default: return 'badge-neutral';
    }
  }

  canExtend(borrowing: Borrowing): boolean {
    return (borrowing.status === 'BORROWED' || borrowing.status === 'EXTENDED') && !this.isOverdueMode;
  }

  canReturn(borrowing: Borrowing): boolean {
    return (borrowing.status === 'BORROWED' || borrowing.status === 'EXTENDED' || borrowing.status === 'OVERDUE')
      && this.canManageBorrowings();
  }
}
