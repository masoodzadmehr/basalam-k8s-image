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
    <div class="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      <h1 class="font-display text-2xl font-bold text-ink mb-6">Users</h1>

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
                <th class="text-left p-3 font-semibold text-slate text-sm uppercase tracking-wider">Role</th>
                <th class="p-3 font-semibold text-slate text-sm uppercase tracking-wider">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr class="border-b border-wood/10 hover:bg-wood/5 transition-colors cursor-pointer"
                    (click)="selectedUser.set(selectedUser()?.id === user.id ? null : user)">
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
                  <td class="p-3 text-center">
                    <button class="text-slate hover:text-brass transition-colors text-sm"
                            title="View details">
                      &#128065;
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Expanded user details row -->
          @if (selectedUser(); as u) {
            <div class="p-4 bg-wood/5 border-b border-wood/10">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-slate-light">Username:</span>
                  <span class="text-ink ml-2 font-medium">{{ u.username }}</span>
                </div>
                <div>
                  <span class="text-slate-light">Email:</span>
                  <span class="text-ink ml-2">{{ u.email }}</span>
                </div>
                <div>
                  <span class="text-slate-light">Mobile:</span>
                  <span class="text-ink ml-2">{{ u.mobile ?? 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-slate-light">Full Name:</span>
                  <span class="text-ink ml-2">{{ u.firstName }} {{ u.lastName }}</span>
                </div>
                <div>
                  <span class="text-slate-light">Role:</span>
                  <span class="badge ml-2 text-xs"
                        [ngClass]="{
                          'badge-active': u.role === 'ADMIN',
                          'badge-pending': u.role === 'LIBRARIAN',
                          'badge-cancelled': u.role === 'USER'
                        }">
                    {{ u.role }}
                  </span>
                </div>
                <div>
                  <span class="text-slate-light">Status:</span>
                  <span class="ml-2" [ngClass]="u.enabled ? 'text-success' : 'text-danger'">
                    {{ u.enabled ? 'Active' : 'Disabled' }}
                  </span>
                </div>
              </div>
            </div>
          }

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
