import { Routes } from '@angular/router';
import { AdminDashboardPageComponent } from './pages/admin-dashboard/admin-dashboard.page';
import { DoctorDashboardPageComponent } from './pages/doctor-dashboard/doctor-dashboard.page';
import { LoginPageComponent } from './pages/login/login.page';
import { NotFoundPageComponent } from './pages/not-found/not-found.page';
import { PatientDashboardPageComponent } from './pages/patient-dashboard/patient-dashboard.page';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'patient/dashboard', component: PatientDashboardPageComponent },
	{ path: 'doctor/dashboard', component: DoctorDashboardPageComponent },
	{ path: 'admin/dashboard', component: AdminDashboardPageComponent },
	{ path: '**', component: NotFoundPageComponent }
];
