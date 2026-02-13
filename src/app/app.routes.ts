import { Routes } from '@angular/router';
import { guestOnlyGuard, roleGuard } from './core/guards/auth.guards';
import { AdminDashboardPageComponent } from './pages/admin-dashboard/admin-dashboard.page';
import { BillingPageComponent } from './pages/billing/billing.page';
import { DoctorDirectoryPageComponent } from './pages/doctor-directory/doctor-directory.page';
import { DoctorDashboardPageComponent } from './pages/doctor-dashboard/doctor-dashboard.page';
import { DoctorProfilePageComponent } from './pages/doctor-profile/doctor-profile.page';
import { LoginPageComponent } from './pages/login/login.page';
import { MessagesPageComponent } from './pages/messages/messages.page';
import { NotFoundPageComponent } from './pages/not-found/not-found.page';
import { PatientDashboardPageComponent } from './pages/patient-dashboard/patient-dashboard.page';
import { PatientProfilePageComponent } from './pages/patient-profile/patient-profile.page';
import { SignupPageComponent } from './pages/signup/signup.page';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: LoginPageComponent, canActivate: [guestOnlyGuard] },
	{ path: 'signup', component: SignupPageComponent, canActivate: [guestOnlyGuard] },
	{ path: 'patient/dashboard', component: PatientDashboardPageComponent, canActivate: [roleGuard('patient')] },
	{ path: 'patient/profile', component: PatientProfilePageComponent, canActivate: [roleGuard('patient')] },
	{ path: 'billing', component: BillingPageComponent, canActivate: [roleGuard(['patient', 'admin'])] },
	{ path: 'patient/doctors', component: DoctorDirectoryPageComponent, canActivate: [roleGuard('patient')] },
	{ path: 'patient/doctors/:doctorId', component: DoctorProfilePageComponent, canActivate: [roleGuard('patient')] },
	{ path: 'messages', component: MessagesPageComponent, canActivate: [roleGuard(['patient', 'doctor', 'admin'])] },
	{ path: 'doctor/dashboard', component: DoctorDashboardPageComponent, canActivate: [roleGuard('doctor')] },
	{ path: 'admin/dashboard', component: AdminDashboardPageComponent, canActivate: [roleGuard('admin')] },
	{ path: '**', component: NotFoundPageComponent }
];
