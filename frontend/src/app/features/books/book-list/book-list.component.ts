import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Book } from '../../../core/models';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss'],
})
export class BookListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  books = signal<Book[]>([]);
  totalElements = signal(0);
  loading = signal(false);
  userRole = this.authService.userRole;

  searchControl = new FormControl('');
  displayedColumns: string[] = ['title', 'author', 'isbn', 'availableCopies', 'copiesCount', 'actions'];

  pageIndex = 0;
  pageSize = 10;

  ngOnInit(): void {
    this.loadBooks();
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadBooks();
      });
  }

  loadBooks(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.pageIndex),
      size: String(this.pageSize),
    };
    const search = this.searchControl.value?.trim();
    if (search) {
      params['search'] = search;
    }
    this.apiService.get<{ content: Book[]; totalElements: number }>('/books', params).subscribe({
      next: (res) => {
        this.books.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.books.set([]);
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBooks();
  }

  onRowClick(book: Book): void {
    this.router.navigate(['/books', book.id]);
  }

  canManage(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
  }

  getStatusChip(available: number): string {
    if (available > 0) { return 'Available'; }
    return 'Unavailable';
  }

  getStatusColor(available: number): string {
    return available > 0 ? 'primary' : 'warn';
  }
}
