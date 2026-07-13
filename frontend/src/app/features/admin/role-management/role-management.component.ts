import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/toast.service';
import type { User } from '../../../core/models';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, NgClass],
  template: `
    <div class="space-y-6">
      <h1 class="font-display text-2xl font-extrabold text-ink">Role Management</h1>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin h-8 w-8 border-2 border-ink/15 border-t-ink rounded-full"></div>
        </div>
      } @else if (users().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">&#x2699;&#xFE0F;</div>
          <h3 class="empty-state-title">No users found</h3>
        </div>
      } @else {
        <div class="card-flush overflow-hidden">
          <table class="table-root">
            <thead>
              <tr>
                <th>Username</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Change to</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>{{ user.username }}</td>
                  <td>{{ user.firstName }}</td>
                  <td>{{ user.lastName }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge text-xs"
                          [ngClass]="{
                            'badge-info': user.role === 'ADMIN',
                            'badge-warning': user.role === 'LIBRARIAN',
                            'badge-neutral': user.role === 'USER'
                          }">
                      {{ user.role }}
                    </span>
                  </td>
                  <td>
                    @if (savingId() === user.id) {
                      <div class="animate-spin h-5 w-5 border-2 border-ink/15 border-t-ink
                                  rounded-full inline-block"></div>
                    } @else {
                      <select class="input-field w-auto text-sm !py-1"
                              [value]="user.role"
                              (change)="changeRole(user, $any($event.target).value)">
                        @for (role of roles; track role) {
                          <option [value]="role">{{ role }}</option>
                        }
                      </select>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-border">
            <div class="text-sm text-ink-muted">
              {{ pageIndex * pageSize + 1 }}&ndash;{{ ((pageIndex + 1) * pageSize > totalElements() ? totalElements() : (pageIndex + 1) * pageSize) }}
              of {{ totalElements() }}
            </div>
            <div class="flex items-center gap-2">
              <select class="input-field w-auto text-sm !py-1.5"
                      [value]="pageSize"
                      (change)="onPageSizeChange($any($event.target).value)">
                <option [value]="5">5</option>
                <option [value]="10">10</option>
                <option [value]="20">20</option>
                <option [value]="50">50</option>
              </select>
              <span class="text-sm text-ink-muted">per page</span>
              <div class="flex gap-1 ml-3">
                <button class="btn btn-ghost btn-sm" [disabled]="pageIndex === 0" (click)="goToPage(0)">First</button>
                <button class="btn btn-ghost btn-sm" [disabled]="pageIndex === 0" (click)="goToPage(pageIndex - 1)">Prev</button>
                <span class="flex items-center px-2 text-sm text-ink tabular-nums">
                  {{ pageIndex + 1 }} / {{ totalPages() || 1 }}
                </span>
                <button class="btn btn-ghost btn-sm" [disabled]="(pageIndex + 1) * pageSize >= totalElements()" (click)="goToPage(pageIndex + 1)">Next</button>
                <button class="btn btn-ghost btn-sm" [disabled]="(pageIndex + 1) * pageSize >= totalElements()" (click)="goToPage(totalPages() - 1)">Last</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class RoleManagementComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);

  users = signal<User[]>([]);
  totalElements = signal(0);
  loading = signal(true);
  savingId = signal<number | null>(null);

  roles: string[] = ['USER', 'LIBRARIAN', 'ADMIN'];
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

  totalPages(): number {
    return Math.ceil(this.totalElements() / this.pageSize) || 1;
  }

  goToPage(page: number): void {
    this.pageIndex = Math.max(0, Math.min(page, this.totalPages() - 1));
    this.loadUsers();
  }

  onPageSizeChange(size: string): void {
    this.pageSize = Number(size);
    this.pageIndex = 0;
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
        this.toast.show('Role updated successfully!', 'success');
      },
      error: (err) => {
        this.savingId.set(null);
        this.toast.show(err?.error?.message ?? 'Failed to update role', 'error');
      },
    });
  }
}
