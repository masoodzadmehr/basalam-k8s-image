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
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-ink">
            @if (isOverdueMode) {
              Overdue Borrowings
            } @else if (isAllMode) {
              All Borrowings
            } @else {
              My Borrowings
            }
          </h1>
          <p class="text-ink-muted text-sm mt-1">
            @if (isOverdueMode) {
              Items past their due date
            } @else if (isAllMode) {
              {{ totalElements() }} borrowing{{ totalElements() !== 1 ? 's' : '' }}
            } @else {
              Your currently borrowed books
            }
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          @if (!isOverdueMode) {
            <select
              class="input-field w-auto min-w-[150px]"
              [value]="statusFilter()"
              (change)="onStatusFilterChange($any($event.target).value)">
              <option value="">All Statuses</option>
              <option value="BORROWED">Active</option>
              <option value="EXTENDED">Extended</option>
              <option value="RETURNED">Returned</option>
            </select>
          }
          <div class="flex gap-1">
            @if (canManageBorrowings() && !isAllMode) {
              <a routerLink="/borrowings/all" class="btn btn-ghost btn-sm">View All</a>
            }
            @if (canManageBorrowings() && !isOverdueMode) {
              <a routerLink="/borrowings/overdue" class="btn btn-ghost btn-sm">Overdue</a>
            }
          </div>
          <a routerLink="/borrowings/new" class="btn btn-accent btn-sm">Borrow</a>
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
          <div class="empty-state-icon">&#x1F4D6;</div>
          <h3 class="empty-state-title">No borrowings found</h3>
          <p class="empty-state-text">Active borrowings will appear here.</p>
        </div>
      }

      <!-- Desktop Table -->
      @if (!loading() && borrowings().length > 0) {
        <div class="card-flush overflow-hidden">
          <table class="table-root">
            <thead>
              <tr>
                @if (isAllMode || isOverdueMode) {
                  <th>User</th>
                }
                <th>Book</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th class="hidden sm:table-cell">Actions</th>
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
                      {{ b.status | titlecase }}
                    </span>
                  </td>
                  <td class="hidden sm:table-cell">
                    <div class="flex gap-1">
                      @if (canExtend(b)) {
                        <button class="btn btn-ghost btn-sm" (click)="extendBorrowing(b)">Extend</button>
                      }
                      @if (canReturn(b)) {
                        <button class="btn btn-accent btn-sm" (click)="returnBook(b)">Return</button>
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
                <span>Borrowed: {{ b.borrowDate | date:'yyyy/MM/dd' }}</span>
                <span [class.text-danger]="isOverdueMode || b.status === 'OVERDUE'">
                  Due: {{ b.dueDate | date:'yyyy/MM/dd' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="badge" [ngClass]="getStatusBadgeClass(b.status)">
                  {{ b.status | titlecase }}
                </span>
                <div class="flex gap-1">
                  @if (canExtend(b)) {
                    <button class="btn btn-ghost btn-sm" (click)="extendBorrowing(b)">Extend</button>
                  }
                  @if (canReturn(b)) {
                    <button class="btn btn-accent btn-sm" (click)="returnBook(b)">Return</button>
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
          <button class="btn btn-ghost btn-sm" [disabled]="pageIndex === 0" (click)="goToPage(0)">First</button>
          <button class="btn btn-ghost btn-sm" [disabled]="pageIndex === 0" (click)="goToPage(pageIndex - 1)">Prev</button>
          <span class="text-sm text-ink-muted tabular-nums px-2">Page {{ pageIndex + 1 }} of {{ totalPages() }}</span>
          <button class="btn btn-ghost btn-sm" [disabled]="pageIndex + 1 >= totalPages()" (click)="goToPage(pageIndex + 1)">Next</button>
          <button class="btn btn-ghost btn-sm" [disabled]="pageIndex + 1 >= totalPages()" (click)="goToPage(totalPages() - 1)">Last</button>
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
        this.toastService.show('Borrowing extended!', 'success');
        this.loadBorrowings();
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'Failed to extend', 'error');
      },
    });
  }

  returnBook(borrowing: Borrowing): void {
    this.apiService.post(`/borrowings/${borrowing.id}/return`, {}).subscribe({
      next: () => {
        this.toastService.show('Book returned!', 'success');
        this.loadBorrowings();
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'Failed to return book', 'error');
      },
    });
  }

  canManageBorrowings(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
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
