import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
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
import type { Fine } from '../../../core/models';

@Component({
  selector: 'app-fine-list',
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
  templateUrl: './fine-list.component.html',
  styleUrls: ['./fine-list.component.scss'],
})
export class FineListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  fines = signal<Fine[]>([]);
  totalElements = signal(0);
  loading = signal(true);
  userRole = this.authService.userRole;

  isAllMode = false;
  pageIndex = 0;
  pageSize = 10;

  displayedColumns: string[] = ['bookTitle', 'amount', 'daysOverdue', 'paid', 'actions'];
  allColumns: string[] = ['username', 'bookTitle', 'amount', 'daysOverdue', 'paid', 'actions'];

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

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadFines();
  }

  payFine(fine: Fine): void {
    this.apiService.post(`/fines/${fine.id}/pay`, {}).subscribe({
      next: () => {
        this.snackBar.open('Fine marked as paid', 'Close', { duration: 3000 });
        this.loadFines();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to pay fine', 'Close', { duration: 5000 });
      },
    });
  }

  canManageFines(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
  }

  getColumns(): string[] {
    return this.isAllMode ? this.allColumns : this.displayedColumns;
  }
}
