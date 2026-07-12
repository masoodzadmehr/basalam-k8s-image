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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Borrowing } from '../../../core/models';

@Component({
  selector: 'app-borrowing-list',
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
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './borrowing-list.component.html',
  styleUrls: ['./borrowing-list.component.scss'],
})
export class BorrowingListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  borrowings = signal<Borrowing[]>([]);
  totalElements = signal(0);
  loading = signal(true);
  userRole = this.authService.userRole;

  displayedColumns: string[] = ['bookTitle', 'borrowDate', 'dueDate', 'status', 'actions'];
  allColumns: string[] = ['username', 'bookTitle', 'borrowDate', 'dueDate', 'status', 'actions'];

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

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBorrowings();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.pageIndex = 0;
    this.loadBorrowings();
  }

  extendBorrowing(borrowing: Borrowing): void {
    this.apiService.post(`/borrowings/${borrowing.id}/extend`, {}).subscribe({
      next: () => {
        this.snackBar.open('Borrowing extended!', 'Close', { duration: 3000 });
        this.loadBorrowings();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to extend', 'Close', { duration: 5000 });
      },
    });
  }

  returnBook(borrowing: Borrowing): void {
    this.apiService.post(`/borrowings/${borrowing.id}/return`, {}).subscribe({
      next: () => {
        this.snackBar.open('Book returned!', 'Close', { duration: 3000 });
        this.loadBorrowings();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to return book', 'Close', { duration: 5000 });
      },
    });
  }

  canManageBorrowings(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
  }

  getColumns(): string[] {
    return this.isAllMode || this.isOverdueMode ? this.allColumns : this.displayedColumns;
  }

  getStatusChipColor(status: string): string {
    switch (status) {
      case 'BORROWED': return 'primary';
      case 'OVERDUE': return 'warn';
      case 'EXTENDED': return 'accent';
      case 'RETURNED': return '';
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
