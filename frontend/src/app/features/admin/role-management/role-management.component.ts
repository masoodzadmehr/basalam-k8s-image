import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import type { User } from '../../../core/models';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.scss'],
})
export class RoleManagementComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  users = signal<User[]>([]);
  totalElements = signal(0);
  loading = signal(true);
  savingId = signal<number | null>(null);

  roles: string[] = ['USER', 'LIBRARIAN', 'ADMIN'];
  displayedColumns: string[] = ['username', 'firstName', 'lastName', 'email', 'role', 'changeRole'];
  pageIndex = 0;
  pageSize = 10;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.pageIndex),
      size: String(this.pageSize),
    };
    this.apiService.get<{ content: User[]; totalElements: number }>('/users', params).subscribe({
      next: (res) => {
        this.users.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  changeRole(user: User, newRole: string): void {
    if (newRole === user.role) {
      return;
    }
    this.savingId.set(user.id);
    this.apiService.put<User>(`/users/${user.id}/role`, { role: newRole }).subscribe({
      next: (updated) => {
        this.savingId.set(null);
        this.users.update(list =>
          list.map(u => u.id === user.id ? { ...u, role: updated.role } : u),
        );
        this.snackBar.open('Role updated successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.savingId.set(null);
        this.snackBar.open(err?.error?.message ?? 'Failed to update role', 'Close', { duration: 5000 });
      },
    });
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMIN': return 'warn';
      case 'LIBRARIAN': return 'accent';
      default: return 'primary';
    }
  }
}
