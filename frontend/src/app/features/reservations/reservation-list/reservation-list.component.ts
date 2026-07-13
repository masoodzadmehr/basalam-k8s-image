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
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-ink">
            {{ isAllMode ? 'All Reservations' : 'My Reservations' }}
          </h1>
          <p class="text-ink-muted text-sm mt-1">
            {{ isAllMode ? 'Manage all library reservations' : 'Your book reservations' }}
          </p>
        </div>
        @if (!isAllMode) {
          <a routerLink="/reservations/all" class="btn btn-ghost btn-sm">View All</a>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-ink/15 border-t-ink"></div>
        </div>
      } @else if (reservations().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">&#x1F4C5;</div>
          <h3 class="empty-state-title">No reservations found</h3>
          <p class="empty-state-text">Reserved books will appear here.</p>
        </div>
      } @else {
        <div class="card-flush overflow-hidden hidden md:block">
          <table class="table-root">
            <thead>
              <tr>
                @if (isAllMode) { <th>User</th> }
                <th>Book</th>
                <th>Reserved</th>
                <th>Expires</th>
                <th>Status</th>
                <th class="hidden sm:table-cell">Actions</th>
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
                      {{ r.status | titlecase }}
                    </span>
                  </td>
                  <td class="hidden sm:table-cell">
                    @if (r.status === 'PENDING') {
                      <button class="btn btn-ghost btn-sm !text-danger hover:!bg-danger-subtle"
                              (click)="cancelReservation(r)">Cancel</button>
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
                <span>Reserved: {{ r.reserveDate | date:'yyyy/MM/dd' }}</span>
                <span [class.text-danger]="r.status === 'EXPIRED'">Expires: {{ r.expiryDate | date:'yyyy/MM/dd' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="badge" [ngClass]="getStatusBadgeClass(r.status)">
                  {{ r.status | titlecase }}
                </span>
                @if (r.status === 'PENDING') {
                  <button class="btn btn-ghost btn-sm !text-danger" (click)="cancelReservation(r)">Cancel</button>
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
      case 'PENDING': return 'badge-warning';
      case 'FULFILLED': return 'badge-success';
      case 'CANCELLED': return 'badge-neutral';
      case 'EXPIRED': return 'badge-info';
      default: return 'badge-neutral';
    }
  }
}
