import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import type { User } from '../../../core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NgClass],
  template: `
    <div class="space-y-6">
      <h1 class="font-display text-2xl font-extrabold text-ink">Users</h1>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin h-8 w-8 border-2 border-ink/15 border-t-ink rounded-full"></div>
        </div>
      } @else if (users().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">&#x1F465;</div>
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
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr class="cursor-pointer"
                    (click)="selectedUser.set(selectedUser()?.id === user.id ? null : user)">
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
                  <td class="text-center">
                    <span class="text-ink-muted text-sm">&#x1F441;</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Expanded user details row -->
          @if (selectedUser(); as u) {
            <div class="p-5 bg-page border-b border-border">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-ink-muted text-xs uppercase tracking-wider">Username</span>
                  <p class="text-ink font-medium mt-0.5">{{ u.username }}</p>
                </div>
                <div>
                  <span class="text-ink-muted text-xs uppercase tracking-wider">Email</span>
                  <p class="text-ink mt-0.5">{{ u.email }}</p>
                </div>
                <div>
                  <span class="text-ink-muted text-xs uppercase tracking-wider">Mobile</span>
                  <p class="text-ink mt-0.5">{{ u.mobile ?? 'N/A' }}</p>
                </div>
                <div>
                  <span class="text-ink-muted text-xs uppercase tracking-wider">Full Name</span>
                  <p class="text-ink mt-0.5">{{ u.firstName }} {{ u.lastName }}</p>
                </div>
                <div>
                  <span class="text-ink-muted text-xs uppercase tracking-wider">Role</span>
                  <p class="mt-0.5">
                    <span class="badge text-xs"
                          [ngClass]="{
                            'badge-info': u.role === 'ADMIN',
                            'badge-warning': u.role === 'LIBRARIAN',
                            'badge-neutral': u.role === 'USER'
                          }">
                      {{ u.role }}
                    </span>
                  </p>
                </div>
                <div>
                  <span class="text-ink-muted text-xs uppercase tracking-wider">Status</span>
                  <p class="mt-0.5" [ngClass]="u.enabled ? 'text-success' : 'text-danger'">
                    {{ u.enabled ? 'Active' : 'Disabled' }}
                  </p>
                </div>
              </div>
            </div>
          }

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
export class UserListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  users = signal<User[]>([]);
  totalElements = signal(0);
  loading = signal(true);
  selectedUser = signal<User | null>(null);

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
    this.selectedUser.set(null);
    this.loadUsers();
  }

  onPageSizeChange(size: string): void {
    this.pageSize = Number(size);
    this.pageIndex = 0;
    this.selectedUser.set(null);
    this.loadUsers();
  }
}
