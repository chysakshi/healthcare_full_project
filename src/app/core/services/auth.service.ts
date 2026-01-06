import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HealthcareDataService } from './healthcare-data.service';
import { User, UserRole } from '../models/healthcare.models';

interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
}

interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

const SESSION_STORAGE_KEY = 'healthcare.session.user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readSession());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly healthcareDataService: HealthcareDataService) {}

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  login(email: string, password: string, role: UserRole): Observable<AuthResult> {
    const user = this.healthcareDataService.findUserByEmail(email);

    if (!user || user.password !== password) {
      return of({ success: false, message: 'Invalid email or password.' });
    }

    if (user.role !== role) {
      return of({ success: false, message: 'Selected role does not match this account.' });
    }

    this.writeSession(user);
    this.currentUserSubject.next(user);
    return of({ success: true, user });
  }

  signup(payload: SignupPayload): Observable<AuthResult> {
    const existingUser = this.healthcareDataService.findUserByEmail(payload.email);
    if (existingUser) {
      return of({ success: false, message: 'An account with this email already exists.' });
    }

    const generatedUser: User = {
      id: `${payload.role.charAt(0)}-${Date.now()}`,
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      role: payload.role,
      isActive: true
    };

    this.healthcareDataService.addUser(generatedUser);
    this.writeSession(generatedUser);
    this.currentUserSubject.next(generatedUser);

    return of({ success: true, user: generatedUser });
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  setCurrentUser(user: User): void {
    this.writeSession(user);
    this.currentUserSubject.next(user);
  }

  private readSession(): User | null {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private writeSession(user: User): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  }
}
