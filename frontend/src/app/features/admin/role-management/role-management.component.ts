import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/toast.service';
import type { User } from '../../../core/models';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, NgClass],
  styleUrl: './role-management.component.scss',
  template: `
    <div class="role-mgmt">
      <h1 class="role-mgmt__title">&#x200F;&#x645;&#x62F;&#x6CC;&#x631;&#x6CC;&#x62A; &#x646;&#x642;&#x634;&#x200C;&#x647;&#x627;</h1>

      @if (loading()) {
        <div class="role-mgmt__loading">
          <div class="role-mgmt__spinner"></div>
        </div>
      } @else if (users().length === 0) {
        <div class="role-mgmt__empty">
          <div class="role-mgmt__empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 class="role-mgmt__empty-title">&#x200F;&#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC; &#x6CC;&#x627;&#x641;&#x62A; &#x646;&#x634;&#x62F;</h3>
        </div>
      } @else {
        <div class="role-mgmt__table-wrapper">
          <table class="role-mgmt__table">
            <thead>
              <tr>
                <th>&#x200F;&#x646;&#x627;&#x645; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC;</th>
                <th>&#x200F;&#x646;&#x627;&#x645;</th>
                <th>&#x200F;&#x646;&#x627;&#x645; &#x62E;&#x627;&#x646;&#x648;&#x627;&#x62F;&#x6AF;&#x6CC;</th>
                <th>&#x200F;&#x627;&#x6CC;&#x645;&#x6CC;&#x644;</th>
                <th>&#x200F;&#x646;&#x642;&#x634; &#x641;&#x639;&#x644;&#x6CC;</th>
                <th>&#x200F;&#x62A;&#x63A;&#x6CC;&#x6CC;&#x631; &#x628;&#x647;</th>
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
                    <span class="role-mgmt__badge"
                          [ngClass]="{
                            'role-mgmt__badge--admin': user.role === 'ADMIN',
                            'role-mgmt__badge--librarian': user.role === 'LIBRARIAN',
                            'role-mgmt__badge--user': user.role === 'USER'
                          }">
                      {{ user.role === 'ADMIN' ? '&#x645;&#x62F;&#x6CC;&#x631;' : user.role === 'LIBRARIAN' ? '&#x6A9;&#x62A;&#x627;&#x628;&#x62F;&#x627;&#x631;' : '&#x6A9;&#x627;&#x631;&#x628;&#x631;' }}
                    </span>
                  </td>
                  <td>
                    @if (savingId() === user.id) {
                      <div class="role-mgmt__saving-spinner"></div>
                    } @else {
                      <select class="role-mgmt__role-select"
                              [value]="user.role"
                              (change)="changeRole(user, $any($event.target).value)">
                        <option value="USER">&#x200F;&#x6A9;&#x627;&#x631;&#x628;&#x631;</option>
                        <option value="LIBRARIAN">&#x200F;&#x6A9;&#x62A;&#x627;&#x628;&#x62F;&#x627;&#x631;</option>
                        <option value="ADMIN">&#x200F;&#x645;&#x62F;&#x6CC;&#x631;</option>
                      </select>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="role-mgmt__pagination">
            <div class="role-mgmt__pagination-info">
              {{ pageIndex * pageSize + 1 }}&ndash;{{ ((pageIndex + 1) * pageSize > totalElements() ? totalElements() : (pageIndex + 1) * pageSize) }}
              &#x627;&#x632; {{ totalElements() }}
            </div>
            <div class="role-mgmt__pagination-controls">
              <select class="role-mgmt__page-size"
                      [value]="pageSize"
                      (change)="onPageSizeChange($any($event.target).value)">
                <option [value]="5">5</option>
                <option [value]="10">10</option>
                <option [value]="20">20</option>
                <option [value]="50">50</option>
              </select>
              <span class="role-mgmt__per-page">&#x62F;&#x631; &#x635;&#x641;&#x62D;&#x647;</span>
              <div class="role-mgmt__pagination-buttons">
                <button class="role-mgmt__page-btn" [disabled]="pageIndex === 0" (click)="goToPage(0)">&#x627;&#x648;&#x644;&#x6CC;&#x646;</button>
                <button class="role-mgmt__page-btn" [disabled]="pageIndex === 0" (click)="goToPage(pageIndex - 1)">&#x642;&#x628;&#x644;&#x6CC;</button>
                <span class="role-mgmt__page-num">{{ pageIndex + 1 }} / {{ totalPages() || 1 }}</span>
                <button class="role-mgmt__page-btn" [disabled]="(pageIndex + 1) * pageSize >= totalElements()" (click)="goToPage(pageIndex + 1)">&#x628;&#x639;&#x62F;&#x6CC;</button>
                <button class="role-mgmt__page-btn" [disabled]="(pageIndex + 1) * pageSize >= totalElements()" (click)="goToPage(totalPages() - 1)">&#x622;&#x62E;&#x631;&#x6CC;&#x646;</button>
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
        this.toast.show('&#x646;&#x642;&#x634; &#x628;&#x627; &#x645;&#x648;&#x641;&#x642;&#x6CC;&#x62A; &#x628;&#x631;&#x648;&#x632;&#x631;&#x633;&#x627;&#x646;&#x6CC; &#x634;&#x62F;!', 'success');
      },
      error: (err) => {
        this.savingId.set(null);
        this.toast.show(err?.error?.message ?? 'Failed to update role', 'error');
      },
    });
  }
}
