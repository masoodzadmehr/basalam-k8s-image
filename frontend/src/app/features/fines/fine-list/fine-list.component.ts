import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast.service';
import type { Fine } from '../../../core/models';

@Component({
  selector: 'app-fine-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrl: './fine-list.component.scss',
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-ink">
            {{ isAllMode ? 'تمام جریمه‌ها' : 'جریمه‌های من' }}
          </h1>
          <p class="text-ink-muted text-sm mt-1">
            {{ isAllMode ? 'مدیریت تمام جریمه‌های کتابخانه' : 'جریمه‌های معوقه شما' }}
          </p>
        </div>
        @if (!isAllMode) {
          <a routerLink="/fines/all" class="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>مشاهده همه</span>
          </a>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-ink/15 border-t-ink"></div>
        </div>
      } @else if (fines().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h3 class="empty-state-title">جریمه‌ای یافت نشد</h3>
          <p class="empty-state-text">جریمه‌های معوقه اینجا نمایش داده می‌شوند.</p>
        </div>
      } @else {
        <div class="card-flush overflow-hidden hidden md:block">
          <table class="table-root">
            <thead>
              <tr>
                @if (isAllMode) { <th>کاربر</th> }
                <th>کتاب</th>
                <th class="text-right">مبلغ</th>
                <th>روزهای دیرکرد</th>
                <th>وضعیت</th>
                @if (canManageFines()) { <th>عملیات</th> }
              </tr>
            </thead>
            <tbody>
              @for (f of fines(); track f.id) {
                <tr>
                  @if (isAllMode) { <td>{{ f.username }}</td> }
                  <td class="font-medium">{{ f.bookTitle }}</td>
                  <td class="text-right font-mono font-medium">
                    {{ f.amount | number:'1.2-2' }}
                  </td>
                  <td class="text-ink-muted">{{ f.daysOverdue }}</td>
                  <td>
                    @if (f.paid) {
                      <span class="badge badge-success">پرداخت شده</span>
                    } @else {
                      <span class="badge badge-warning">پرداخت نشده</span>
                    }
                  </td>
                  @if (canManageFines()) {
                    <td>
                      @if (!f.paid) {
                        <button class="btn btn-accent btn-sm" (click)="payFine(f)">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          <span>پرداخت</span>
                        </button>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="md:hidden flex flex-col gap-3">
          @for (f of fines(); track f.id) {
            <div class="card !p-4">
              @if (isAllMode) {
                <p class="text-xs text-ink-muted mb-1">{{ f.username }}</p>
              }
              <h3 class="font-display font-semibold text-base mb-2">{{ f.bookTitle }}</h3>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted mb-3">
                <span>{{ f.daysOverdue }} روز دیرکرد</span>
                <span class="font-bold text-ink font-mono">{{ f.amount | number:'1.2-2' }}</span>
              </div>
              <div class="flex items-center justify-between">
                @if (f.paid) {
                  <span class="badge badge-success">پرداخت شده</span>
                } @else {
                  <span class="badge badge-warning">پرداخت نشده</span>
                }
                @if (canManageFines() && !f.paid) {
                  <button class="btn btn-accent btn-sm" (click)="payFine(f)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span>پرداخت</span>
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
export class FineListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  fines = signal<Fine[]>([]);
  totalElements = signal(0);
  loading = signal(true);
  userRole = this.authService.userRole;

  isAllMode = false;
  pageIndex = 0;
  pageSize = 10;

  ngOnInit(): void {
    this.isAllMode = this.router.url.includes('/all');
    this.loadFines();
  }

  loadFines(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.pageIndex),
      size: String(this.pageSize),
    };
    this.apiService.get<{ content: Fine[]; totalElements: number }>('/fines', params).subscribe({
      next: (res) => {
        this.fines.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPage(page: number): void {
    this.pageIndex = page;
    this.loadFines();
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements() / this.pageSize));
  }

  payFine(fine: Fine): void {
    this.apiService.post(`/fines/${fine.id}/pay`, {}).subscribe({
      next: () => {
        this.toastService.show('جریمه پرداخت شد', 'success');
        this.loadFines();
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'خطا در پرداخت جریمه', 'error');
      },
    });
  }

  canManageFines(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
  }
}
