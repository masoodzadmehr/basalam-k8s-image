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
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-ink">
            {{ isAllMode ? 'All Fines' : 'My Fines' }}
          </h1>
          <p class="text-ink-muted text-sm mt-1">
            {{ isAllMode ? 'Manage all library fines' : 'Your outstanding fines' }}
          </p>
        </div>
        @if (!isAllMode) {
          <a routerLink="/fines/all" class="btn btn-ghost btn-sm">View All</a>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-ink/15 border-t-ink"></div>
        </div>
      } @else if (fines().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">&#x1F4B0;</div>
          <h3 class="empty-state-title">No fines found</h3>
          <p class="empty-state-text">Any outstanding fines will appear here.</p>
        </div>
      } @else {
        <div class="card-flush overflow-hidden hidden md:block">
          <table class="table-root">
            <thead>
              <tr>
                @if (isAllMode) { <th>User</th> }
                <th>Book</th>
                <th class="text-right">Amount</th>
                <th>Days Overdue</th>
                <th>Status</th>
                @if (canManageFines()) { <th>Actions</th> }
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
                      <span class="badge badge-success">Paid</span>
                    } @else {
                      <span class="badge badge-warning">Unpaid</span>
                    }
                  </td>
                  @if (canManageFines()) {
                    <td>
                      @if (!f.paid) {
                        <button class="btn btn-accent btn-sm" (click)="payFine(f)">Pay</button>
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
                <span>{{ f.daysOverdue }} days overdue</span>
                <span class="font-bold text-ink font-mono">{{ f.amount | number:'1.2-2' }}</span>
              </div>
              <div class="flex items-center justify-between">
                @if (f.paid) {
                  <span class="badge badge-success">Paid</span>
                } @else {
                  <span class="badge badge-warning">Unpaid</span>
                }
                @if (canManageFines() && !f.paid) {
                  <button class="btn btn-accent btn-sm" (click)="payFine(f)">Pay</button>
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
