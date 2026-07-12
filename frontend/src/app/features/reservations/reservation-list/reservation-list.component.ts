import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Reservation } from '../../../core/models';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss'],
})
export class ReservationListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  reservations = signal<Reservation[]>([]);
  totalElements = signal(0);
  loading = signal(true);
  userRole = this.authService.userRole;

  displayedColumns: string[] = ['bookTitle', 'reserveDate', 'expiryDate', 'status', 'actions'];
  allColumns: string[] = ['username', 'bookTitle', 'reserveDate', 'expiryDate', 'status', 'actions'];

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

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadReservations();
  }

  cancelReservation(reservation: Reservation): void {
    this.apiService.post(`/reservations/${reservation.id}/cancel`, {}).subscribe({
      next: () => {
        this.snackBar.open('Reservation cancelled', 'Close', { duration: 3000 });
        this.loadReservations();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to cancel', 'Close', { duration: 5000 });
      },
    });
  }

  getColumns(): string[] {
    return this.isAllMode ? this.allColumns : this.displayedColumns;
  }

  getStatusChipColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'primary';
      case 'FULFILLED': return 'accent';
      case 'CANCELLED': return 'warn';
      case 'EXPIRED': return '';
      default: return '';
    }
  }
}
