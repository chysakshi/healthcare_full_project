import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss'
})
export class AdminDashboardPageComponent implements OnInit {
  protected totalUsers = 0;
  protected appointmentsToday = 0;
  protected openBillingTickets = 0;
  protected completionRate = 0;
  protected readonly operationsFeed: string[] = [];

  constructor(private readonly healthcareDataService: HealthcareDataService) {}

  ngOnInit(): void {
    this.healthcareDataService.getUsers().subscribe((users) => {
      this.totalUsers = users.length;
    });

    this.healthcareDataService.getAppointments().subscribe((appointments) => {
      const today = new Date().toDateString();
      const todaysAppointments = appointments.filter((appointment) => new Date(appointment.startsAt).toDateString() === today);
      const completedAppointments = todaysAppointments.filter((appointment) => appointment.status === 'completed').length;

      this.appointmentsToday = todaysAppointments.length;
      this.completionRate = todaysAppointments.length
        ? Math.round((completedAppointments / todaysAppointments.length) * 100)
        : 0;
    });

    this.healthcareDataService.getInvoices().subscribe((invoices) => {
      this.openBillingTickets = invoices.filter((invoice) => invoice.status !== 'paid').length;
    });

    this.operationsFeed.push(
      'Provider onboarding verification completed for Cardiology.',
      'Billing reconciliation batch processed successfully.',
      'Platform alert monitoring is within operational threshold.'
    );
  }
}
