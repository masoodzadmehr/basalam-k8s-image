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
  template: `
    <div class="p-4 md:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold text-ink mb-1">
            {{ isAllMode ? 'All Fines' : 'My Fines' }}
          </h1>
          <p class="text-sm text-slate-light">
            {{ isAllMode ? 'Manage all library fines' : 'Your outstanding fines' }}
          </p>
        </div>
        @if (!isAllMode) {
          <a routerLink="/fines/all" class="btn btn-secondary btn-sm">View All</a>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="w-10 h-10 border-[3px] border-parchment border-t-brass rounded-full animate-spin"></div>
        </div>
      }
      @else if (fines().length === 0) {
        <div class="card text-center py-12 text-slate-light">
          <p class="text-lg mb-2">No fines found</p>
          <p>Any outstanding fines will appear here.</p>
        </div>
      }
      @else {
        <!-- Desktop Table -->
        <div class="hidden md:block card !p-0 overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-parchment bg-parchment/30">
                @if (isAllMode) {
                  <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">User</th>
                }
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Book</th>
                <th class="table-header text-right px-4 py-3 sticky top-0 bg-parchment/30">Amount</th>
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Days Overdue</th>
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Status</th>
                @if (canManageFines()) {
                  <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Actions</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (f of fines(); track f.id; let i = $index) {
                <tr class="border-b border-parchment/50 transition-colors hover:bg-parchment/10"
                    [class.even:bg-parchment/30]="i % 2 === 0">
                  @if (isAllMode) {
                    <td class="px-4 py-3 text-sm">{{ f.username }}</td>
                  }
                  <td class="px-4 py-3 text-sm font-medium">{{ f.bookTitle }}</td>
                  <td class="px-4 py-3 text-sm text-right font-bold">
                    {{ f.amount | number:'1.2-2' }}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-light">{{ f.daysOverdue }}</td>
                  <td class="px-4 py-3">
                    @if (f.paid) {
                      <span class="badge badge-active">Paid</span>
                    } @else {
                      <span class="badge badge-pending">Unpaid</span>
                    }
                  </td>
                  @if (canManageFines()) {
                    <td class="px-4 py-3">
                      @if (!f.paid) {
                        <button class="btn btn-brass btn-sm" (click)="payFine(f)">Pay</button>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden flex flex-col gap-3">
          @for (f of fines(); track f.id) {
            <div class="card p-4">
              @if (isAllMode) {
                <p class="text-xs text-slate-light mb-1">User: <span class="text-ink font-medium">{{ f.username }}</span></p>
              }
              <h3 class="font-display font-semibold text-base mb-2">{{ f.bookTitle }}</h3>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-light mb-3">
                <span>{{ f.daysOverdue }} days overdue</span>
                <span class="font-bold text-ink">{{ f.amount | number:'1.2-2' }}</span>
              </div>
              <div class="flex items-center justify-between">
                @if (f.paid) {
                  <span class="badge badge-active">Paid</span>
                } @else {
                  <span class="badge badge-pending">Unpaid</span>
                }
                @if (canManageFines() && !f.paid) {
                  <button class="btn btn-brass btn-sm" (click)="payFine(f)">Pay</button>
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
        this.toastService.show('Fine marked as paid', 'success');
        this.loadFines();
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'Failed to pay fine', 'error');
      },
    });
  }

  canManageFines(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
  }
}
