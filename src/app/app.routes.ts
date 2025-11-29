import { Routes } from '@angular/router';
import { guestOnlyGuard, roleGuard } from './core/guards/auth.guards';
import { AdminDashboardPageComponent } from './pages/admin-dashboard/admin-dashboard.page';
import { DoctorDashboardPageComponent } from './pages/doctor-dashboard/doctor-dashboard.page';
import { LoginPageComponent } from './pages/login/login.page';
import { NotFoundPageComponent } from './pages/not-found/not-found.page';
import { PatientDashboardPageComponent } from './pages/patient-dashboard/patient-dashboard.page';
import { SignupPageComponent } from './pages/signup/signup.page';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: LoginPageComponent, canActivate: [guestOnlyGuard] },
	{ path: 'signup', component: SignupPageComponent, canActivate: [guestOnlyGuard] },
	{ path: 'patient/dashboard', component: PatientDashboardPageComponent, canActivate: [roleGuard('patient')] },
	{ path: 'doctor/dashboard', component: DoctorDashboardPageComponent, canActivate: [roleGuard('doctor')] },
	{ path: 'admin/dashboard', component: AdminDashboardPageComponent, canActivate: [roleGuard('admin')] },
	{ path: '**', component: NotFoundPageComponent }
];
