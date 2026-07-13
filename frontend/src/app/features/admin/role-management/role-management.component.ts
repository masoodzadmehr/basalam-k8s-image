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
    <div class="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      <h1 class="font-display text-2xl font-bold text-ink mb-6">Role Management</h1>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-2 border-brass border-t-transparent rounded-full"></div>
        </div>
      } @else if (users().length === 0) {
        <div class="card p-8 text-center text-slate">
          No users found.
        </div>
      } @else {
        <div class="card overflow-hidden">
          <table class="w-full border-collapse">
            <thead>
              <tr class="table-header">
                <th class="text-left p-3 font-semibold text-slate text-sm uppercase tracking-wider">Username</th>
                <th class="text-left p-3 font-semibold text-slate text-sm uppercase tracking-wider">First Name</th>
                <th class="text-left p-3 font-semibold text-slate text-sm uppercase tracking-wider">Last Name</th>
                <th class="text-left p-3 font-semibold text-slate text-sm uppercase tracking-wider">Email</th>
                <th class="text-left p-3 font-semibold text-slate text-sm uppercase tracking-wider">Current Role</th>
                <th class="text-left p-3 font-semibold text-slate text-sm uppercase tracking-wider">Change to</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr class="border-b border-wood/10 hover:bg-wood/5 transition-colors">
                  <td class="p-3 text-ink text-sm">{{ user.username }}</td>
                  <td class="p-3 text-ink text-sm">{{ user.firstName }}</td>
                  <td class="p-3 text-ink text-sm">{{ user.lastName }}</td>
                  <td class="p-3 text-ink text-sm">{{ user.email }}</td>
                  <td class="p-3">
                    <span class="badge text-xs"
                          [ngClass]="{
                            'badge-active': user.role === 'ADMIN',
                            'badge-pending': user.role === 'LIBRARIAN',
                            'badge-cancelled': user.role === 'USER'
                          }">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="p-3">
                    @if (savingId() === user.id) {
                      <div class="animate-spin h-5 w-5 border-2 border-brass border-t-transparent
                                  rounded-full inline-block"></div>
                    } @else {
                      <select class="input-field text-sm py-1 w-32"
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
          <div class="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-wood/10">
            <div class="text-sm text-slate-light">
              Showing {{ pageIndex * pageSize + 1 }} -
              {{ (pageIndex + 1) * pageSize > totalElements() ? totalElements() : (pageIndex + 1) * pageSize }}
              of {{ totalElements() }} users
            </div>
            <div class="flex items-center gap-2">
              <select class="input-field text-sm py-1"
                      [value]="pageSize"
                      (change)="onPageSizeChange($any($event.target).value)">
                <option [value]="5">5</option>
                <option [value]="10">10</option>
                <option [value]="20">20</option>
                <option [value]="50">50</option>
              </select>
              <span class="text-sm text-slate-light">per page</span>
              <div class="flex gap-1 ml-4">
                <button class="btn btn-secondary btn-sm px-3"
                        [disabled]="pageIndex === 0"
                        (click)="goToPage(0)">First</button>
                <button class="btn btn-secondary btn-sm px-3"
                        [disabled]="pageIndex === 0"
                        (click)="goToPage(pageIndex - 1)">Prev</button>
                <span class="flex items-center px-2 text-sm text-ink tabular-nums">
                  {{ pageIndex + 1 }} / {{ totalPages() || 1 }}
                </span>
                <button class="btn btn-secondary btn-sm px-3"
                        [disabled]="(pageIndex + 1) * pageSize >= totalElements()"
                        (click)="goToPage(pageIndex + 1)">Next</button>
                <button class="btn btn-secondary btn-sm px-3"
                        [disabled]="(pageIndex + 1) * pageSize >= totalElements()"
                        (click)="goToPage(totalPages() - 1)">Last</button>
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
