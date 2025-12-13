import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { User, UserRole } from './core/models/healthcare.models';
import { AuthService } from './core/services/auth.service';

type NavAccess = 'all' | 'guest' | UserRole[];

interface NavItem {
  label: string;
  link: string;
  access: NavAccess;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected readonly currentUser$ = this.authService.currentUser$;

  protected readonly navItems: NavItem[] = [
    { label: 'Login', link: '/login', access: 'guest' },
    { label: 'Signup', link: '/signup', access: 'guest' },
    { label: 'Patient Dashboard', link: '/patient/dashboard', access: ['patient', 'admin'] },
    { label: 'Doctor Dashboard', link: '/doctor/dashboard', access: ['doctor', 'admin'] },
    { label: 'Admin Dashboard', link: '/admin/dashboard', access: ['admin'] }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  protected canAccess(item: NavItem, currentUser: User | null): boolean {
    if (item.access === 'all') {
      return true;
    }

    if (item.access === 'guest') {
      return !currentUser;
    }

    if (!currentUser) {
      return false;
    }

    return item.access.includes(currentUser.role);
  }

  protected onNavClick(event: MouseEvent, item: NavItem, currentUser: User | null): void {
    if (!this.canAccess(item, currentUser)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
