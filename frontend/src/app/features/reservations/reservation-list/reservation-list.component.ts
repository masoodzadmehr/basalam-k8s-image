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
  template: `
    <div class="p-4 md:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold text-ink mb-1">
            {{ isAllMode ? 'All Reservations' : 'My Reservations' }}
          </h1>
          <p class="text-sm text-slate-light">
            {{ isAllMode ? 'Manage all library reservations' : 'Your book reservations' }}
          </p>
        </div>
        @if (!isAllMode) {
          <a routerLink="/reservations/all" class="btn btn-secondary btn-sm">View All</a>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="w-10 h-10 border-[3px] border-parchment border-t-brass rounded-full animate-spin"></div>
        </div>
      }
      @else if (reservations().length === 0) {
        <div class="card text-center py-12 text-slate-light">
          <p class="text-lg mb-2">No reservations found</p>
          <p>Reserved books will appear here.</p>
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
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Reserved</th>
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Expires</th>
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Status</th>
                <th class="table-header text-left px-4 py-3 sticky top-0 bg-parchment/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (r of reservations(); track r.id; let i = $index) {
                <tr class="border-b border-parchment/50 transition-colors hover:bg-parchment/10"
                    [class.even:bg-parchment/30]="i % 2 === 0">
                  @if (isAllMode) {
                    <td class="px-4 py-3 text-sm">{{ r.username }}</td>
                  }
                  <td class="px-4 py-3 text-sm font-medium">{{ r.bookTitle }}</td>
                  <td class="px-4 py-3 text-sm text-slate-light">{{ r.reserveDate | date:'mediumDate' }}</td>
                  <td class="px-4 py-3 text-sm"
                      [class.text-danger]="r.status === 'EXPIRED'">
                    {{ r.expiryDate | date:'mediumDate' }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="badge" [ngClass]="getStatusBadgeClass(r.status)">
                      {{ r.status | titlecase }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    @if (r.status === 'PENDING') {
                      <button class="btn btn-danger btn-sm" (click)="cancelReservation(r)">Cancel</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden flex flex-col gap-3">
          @for (r of reservations(); track r.id) {
            <div class="card p-4">
              @if (isAllMode) {
                <p class="text-xs text-slate-light mb-1">User: <span class="text-ink font-medium">{{ r.username }}</span></p>
              }
              <h3 class="font-display font-semibold text-base mb-2">{{ r.bookTitle }}</h3>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-light mb-3">
                <span>Reserved: {{ r.reserveDate | date:'mediumDate' }}</span>
                <span [class.text-danger]="r.status === 'EXPIRED'">Expires: {{ r.expiryDate | date:'mediumDate' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="badge" [ngClass]="getStatusBadgeClass(r.status)">
                  {{ r.status | titlecase }}
                </span>
                @if (r.status === 'PENDING') {
                  <button class="btn btn-danger btn-sm" (click)="cancelReservation(r)">Cancel</button>
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
        this.toastService.show('Reservation cancelled', 'success');
        this.loadReservations();
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'Failed to cancel', 'error');
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'FULFILLED': return 'badge-available';
      case 'CANCELLED': return 'badge-cancelled';
      case 'EXPIRED': return 'badge-returned';
      default: return '';
    }
  }
}
