import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, NgClass],
  templateUrl: './main-layout.html',
  styles: ``,
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly userRole = this.authService.userRole;
  protected sidebarOpen = false;
  protected userMenuOpen = false;

  protected readonly allNavItems: NavItem[] = [
    { label: 'Books', icon: '📚', route: '/books' },
    { label: 'My Borrowings', icon: '📖', route: '/borrowings' },
    { label: 'My Reservations', icon: '📅', route: '/reservations' },
    { label: 'My Fines', icon: '💰', route: '/fines' },
    { label: 'Notifications', icon: '🔔', route: '/notifications' },
    { label: 'Profile', icon: '👤', route: '/profile' },
    { label: 'Manage Books', icon: '📚', route: '/books', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'All Borrowings', icon: '📋', route: '/borrowings/all', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'Return Book', icon: '↩️', route: '/borrowings/overdue', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'All Reservations', icon: '📝', route: '/reservations/all', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'Locations', icon: '📍', route: '/locations', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'Users', icon: '👥', route: '/users', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'Role Management', icon: '⚙️', route: '/admin/roles', roles: ['ADMIN'] },
    { label: 'System Config', icon: '🔧', route: '/admin/config', roles: ['ADMIN'] },
  ];

  get filteredNavItems(): NavItem[] {
    const role = this.userRole();
    return this.allNavItems.filter(
      item => !item.roles || item.roles.includes(role),
    );
  }

  get unreadNotifications(): number {
    return 0;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.sidebarOpen = false;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.userMenuOpen = false;
    this.authService.logout();
  }
}
