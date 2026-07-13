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
    <div class="p-4 md:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold text-ink mb-1">
            @if (isOverdueMode) {
              Overdue Borrowings
            } @else if (isAllMode) {
              All Borrowings
            } @else {
              My Borrowings
            }
          </h1>
          <p class="text-sm text-slate-light">
            @if (isOverdueMode) {
              Items past their due date
            } @else if (isAllMode) {
              Manage all library borrowings
            } @else {
              Your currently borrowed books
            }
          </p>
        </div>
        <div class="flex gap-2">
          @if (!isOverdueMode) {
            <select
              class="input-field w-auto min-w-[140px]"
              [value]="statusFilter()"
              (change)="onStatusFilterChange($any($event.target).value)">
              <option value="">All Statuses</option>
              <option value="BORROWED">Active</option>
              <option value="EXTENDED">Extended</option>
              <option value="RETURNED">Returned</option>
            </select>
          }
          @if (canManageBorrowings() && !isAllMode) {
            <a routerLink="/borrowings/all" class="btn btn-secondary btn-sm">View All</a>
          }
          @if (canManageBorrowings() && !isOverdueMode) {
            <a routerLink="/borrowings/overdue" class="btn btn-secondary btn-sm">Overdue</a>
          }
          <a routerLink="/borrowings/new" class="btn btn-primary btn-sm">+ Borrow</a>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="w-10 h-10 border-[3px] border-parchment border-t-brass rounded-full animate-spin"></div>
        </div>
      }
      @else if (borrowings().length === 0) {
        <div class="card text-center py-12 text-slate-light">
          <p class="text-lg mb-2">No borrowings found</p>
          <p>Active borrowings will appear here.</p>
        </div>
      }
      @else {
        <!-- Desktop Table -->
        <div class="hidden md:block card !p-0 overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-parchment bg-parchment/30">
                @if (isAllMode || isOverdueMode) {
                  <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">User</th>
                }
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Book</th>
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Borrow Date</th>
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Due Date</th>
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Status</th>
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (b of borrowings(); track b.id; let i = $index) {
                <tr class="border-b border-parchment/50 transition-colors hover:bg-parchment/10"
                    [class.even:bg-parchment/30]="i % 2 === 0">
                  @if (isAllMode || isOverdueMode) {
                    <td class="px-4 py-3 text-sm">{{ b.username }}</td>
                  }
                  <td class="px-4 py-3 text-sm font-medium">{{ b.bookTitle }}</td>
                  <td class="px-4 py-3 text-sm text-slate-light">{{ b.borrowDate | date:'mediumDate' }}</td>
                  <td class="px-4 py-3 text-sm"
                      [class.text-danger]="isOverdueMode || b.status === 'OVERDUE'">
                    {{ b.dueDate | date:'mediumDate' }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="badge" [ngClass]="getStatusBadgeClass(b.status)">
                      {{ b.status | titlecase }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-1.5">
                      @if (canExtend(b)) {
                        <button class="btn btn-secondary btn-sm" (click)="extendBorrowing(b)">Extend</button>
                      }
                      @if (canReturn(b)) {
                        <button class="btn btn-brass btn-sm" (click)="returnBook(b)">Return</button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden flex flex-col gap-3">
          @for (b of borrowings(); track b.id) {
            <div class="card p-4">
              @if (isAllMode || isOverdueMode) {
                <p class="text-xs text-slate-light mb-1">User: <span class="text-ink font-medium">{{ b.username }}</span></p>
              }
              <h3 class="font-display font-semibold text-base mb-2">{{ b.bookTitle }}</h3>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-light mb-3">
                <span>Borrowed: {{ b.borrowDate | date:'mediumDate' }}</span>
                <span [class.text-danger]="isOverdueMode || b.status === 'OVERDUE'">Due: {{ b.dueDate | date:'mediumDate' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="badge" [ngClass]="getStatusBadgeClass(b.status)">
                  {{ b.status | titlecase }}
                </span>
                <div class="flex gap-1.5">
                  @if (canExtend(b)) {
                    <button class="btn btn-secondary btn-sm" (click)="extendBorrowing(b)">Extend</button>
                  }
                  @if (canReturn(b)) {
                    <button class="btn btn-brass btn-sm" (click)="returnBook(b)">Return</button>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalElements() > pageSize) {
          <div class="flex items-center justify-center gap-2 mt-6">
            <button class="btn btn-secondary btn-sm"
                    [disabled]="pageIndex === 0"
                    (click)="goToPage(0)">
              First
            </button>
            <button class="btn btn-secondary btn-sm"
                    [disabled]="pageIndex === 0"
                    (click)="goToPage(pageIndex - 1)">
              Prev
            </button>
            <span class="text-sm text-slate-light px-2">
              Page {{ pageIndex + 1 }} of {{ totalPages() }}
            </span>
            <button class="btn btn-secondary btn-sm"
                    [disabled]="pageIndex + 1 >= totalPages()"
                    (click)="goToPage(pageIndex + 1)">
              Next
            </button>
            <button class="btn btn-secondary btn-sm"
                    [disabled]="pageIndex + 1 >= totalPages()"
                    (click)="goToPage(totalPages() - 1)">
              Last
            </button>
          </div>
        }
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
      case 'BORROWED': return 'badge-borrowed';
      case 'EXTENDED': return 'badge-available';
      case 'OVERDUE': return 'badge-overdue';
      case 'RETURNED': return 'badge-returned';
      default: return '';
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
