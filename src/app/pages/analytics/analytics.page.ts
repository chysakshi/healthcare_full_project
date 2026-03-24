import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { combineLatest, of } from 'rxjs';
import { Appointment, Invoice, MessageThread, Prescription, User, UserRole } from '../../core/models/healthcare.models';
import { AuthService } from '../../core/services/auth.service';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';

interface MetricCard {
  label: string;
  value: string;
  hint: string;
}

interface BreakdownRow {
  label: string;
  value: number;
  percent: number;
}

interface MonthlyTrend {
  monthLabel: string;
  appointments: number;
  invoices: number;
  messages: number;
}

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.page.html',
  styleUrl: './analytics.page.scss'
})
export class AnalyticsPageComponent implements OnInit {
  protected currentUser: User | null = null;
  protected isLoading = true;
  protected analyticsError = '';

  protected readonly metricCards: MetricCard[] = [];
  protected readonly appointmentBreakdown: BreakdownRow[] = [];
  protected readonly billingBreakdown: BreakdownRow[] = [];
  protected readonly monthlyTrends: MonthlyTrend[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly healthcareDataService: HealthcareDataService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (!user) {
      this.analyticsError = 'Analytics is unavailable without an active session.';
      this.isLoading = false;
      return;
    }

    this.currentUser = user;

    combineLatest([
      this.healthcareDataService.getUsers(),
      this.healthcareDataService.getAppointments(),
      this.healthcareDataService.getInvoices(),
      this.healthcareDataService.getPrescriptions(),
      this.healthcareDataService.getMessageThreads(),
      this.healthcareDataService.getReports(),
      this.healthcareDataService.getDoctorProfiles(),
      this.healthcareDataService.getNotificationsForUser(user.id, user.role)
    ]).subscribe(([users, appointments, invoices, prescriptions, threads, reports, profiles, notifications]) => {
      const scopedAppointments = this.getScopedAppointments(user, appointments);
      const scopedInvoices = this.getScopedInvoices(user, invoices);
      const scopedPrescriptions = this.getScopedPrescriptions(user, prescriptions);
      const scopedThreads = this.getScopedThreads(user, threads);
      const scopedReports = this.getScopedReports(user, reports);

      this.metricCards.splice(
        0,
        this.metricCards.length,
        ...this.buildMetricCards({
          user,
          users,
          profiles,
          appointments: scopedAppointments,
          invoices: scopedInvoices,
          prescriptions: scopedPrescriptions,
          threads: scopedThreads,
          reports: scopedReports,
          notificationCount: notifications.length
        })
      );

      this.appointmentBreakdown.splice(
        0,
        this.appointmentBreakdown.length,
        ...this.buildAppointmentBreakdown(scopedAppointments)
      );

      this.billingBreakdown.splice(0, this.billingBreakdown.length, ...this.buildBillingBreakdown(scopedInvoices));

      this.monthlyTrends.splice(
        0,
        this.monthlyTrends.length,
        ...this.buildMonthlyTrends(scopedAppointments, scopedInvoices, scopedThreads)
      );

      this.isLoading = false;
    });
  }

  private getScopedAppointments(user: User, appointments: Appointment[]): Appointment[] {
    if (user.role === 'admin') {
      return appointments;
    }

    if (user.role === 'doctor') {
      return appointments.filter((appointment) => appointment.doctorId === user.id);
    }

    return appointments.filter((appointment) => appointment.patientId === user.id);
  }

  private getScopedInvoices(user: User, invoices: Invoice[]): Invoice[] {
    if (user.role === 'admin') {
      return invoices;
    }

    return invoices.filter((invoice) => invoice.patientId === user.id);
  }

  private getScopedPrescriptions(user: User, prescriptions: Prescription[]): Prescription[] {
    if (user.role === 'admin') {
      return prescriptions;
    }

    if (user.role === 'doctor') {
      return prescriptions.filter((prescription) => prescription.doctorId === user.id);
    }

    return prescriptions.filter((prescription) => prescription.patientId === user.id);
  }

  private getScopedThreads(user: User, threads: MessageThread[]): MessageThread[] {
    if (user.role === 'admin') {
      return threads;
    }

    return threads.filter((thread) => thread.patientId === user.id || thread.doctorId === user.id);
  }

  private getScopedReports(user: User, reports: Array<{ patientId: string; doctorId: string; status: 'pending' | 'ready' }>): Array<{ patientId: string; doctorId: string; status: 'pending' | 'ready' }> {
    if (user.role === 'admin') {
      return reports;
    }

    if (user.role === 'doctor') {
      return reports.filter((report) => report.doctorId === user.id);
    }

    return reports.filter((report) => report.patientId === user.id);
  }

  private buildMetricCards(payload: {
    user: User;
    users: User[];
    profiles: Array<{ userId: string }>;
    appointments: Appointment[];
    invoices: Invoice[];
    prescriptions: Prescription[];
    threads: MessageThread[];
    reports: Array<{ status: 'pending' | 'ready' }>;
    notificationCount: number;
  }): MetricCard[] {
    const now = Date.now();
    const completedAppointments = payload.appointments.filter((appointment) => appointment.status === 'completed').length;
    const upcomingAppointments = payload.appointments.filter(
      (appointment) =>
        new Date(appointment.startsAt).getTime() > now &&
        appointment.status !== 'completed' &&
        appointment.status !== 'cancelled'
    ).length;
    const completionRate = payload.appointments.length
      ? Math.round((completedAppointments / payload.appointments.length) * 100)
      : 0;

    const outstandingAmount = payload.invoices
      .filter((invoice) => invoice.status !== 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const paidAmount = payload.invoices
      .filter((invoice) => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const unreadMessages = payload.threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
    const pendingReports = payload.reports.filter((report) => report.status === 'pending').length;

    const cards: MetricCard[] = [
      {
        label: 'Appointments In Scope',
        value: `${payload.appointments.length}`,
        hint: `${upcomingAppointments} upcoming | ${completionRate}% completed`
      },
      {
        label: 'Billing Snapshot',
        value: `INR ${outstandingAmount}`,
        hint: `Outstanding amount | INR ${paidAmount} paid`
      },
      {
        label: 'Clinical Records',
        value: `${payload.prescriptions.length}`,
        hint: `Prescriptions | ${pendingReports} reports pending`
      },
      {
        label: 'Communication Load',
        value: `${payload.threads.length}`,
        hint: `${unreadMessages} unread messages | ${payload.notificationCount} notifications`
      }
    ];

    if (payload.user.role === 'admin') {
      const activeDoctors = payload.users.filter((entry) => entry.role === 'doctor' && entry.isActive).length;
      const activePatients = payload.users.filter((entry) => entry.role === 'patient' && entry.isActive).length;
      cards.push({
        label: 'Operational Coverage',
        value: `${activeDoctors} doctors`,
        hint: `${activePatients} active patients | ${payload.profiles.length} provider profiles`
      });
    }

    if (payload.user.role === 'doctor') {
      const uniquePatients = new Set(payload.appointments.map((appointment) => appointment.patientId)).size;
      cards.push({
        label: 'Patient Reach',
        value: `${uniquePatients}`,
        hint: 'Distinct patients from your appointment panel'
      });
    }

    return cards;
  }

  private buildAppointmentBreakdown(appointments: Appointment[]): BreakdownRow[] {
    const labels: Array<Appointment['status']> = ['requested', 'scheduled', 'rescheduled', 'checked-in', 'completed', 'cancelled'];
    const total = Math.max(1, appointments.length);

    return labels.map((label) => {
      const value = appointments.filter((appointment) => appointment.status === label).length;
      return {
        label,
        value,
        percent: Math.round((value / total) * 100)
      };
    });
  }

  private buildBillingBreakdown(invoices: Invoice[]): BreakdownRow[] {
    const labels: Array<Invoice['status']> = ['pending', 'overdue', 'paid'];
    const total = Math.max(1, invoices.length);

    return labels.map((label) => {
      const value = invoices.filter((invoice) => invoice.status === label).length;
      return {
        label,
        value,
        percent: Math.round((value / total) * 100)
      };
    });
  }

  private buildMonthlyTrends(appointments: Appointment[], invoices: Invoice[], threads: MessageThread[]): MonthlyTrend[] {
    const monthKeys = new Set<string>();
    appointments.forEach((appointment) => monthKeys.add(this.toMonthKey(appointment.startsAt)));
    invoices.forEach((invoice) => monthKeys.add(this.toMonthKey(invoice.issuedAt)));
    threads.forEach((thread) => monthKeys.add(this.toMonthKey(thread.updatedAt)));

    const sortedKeys = Array.from(monthKeys).sort((left, right) => left.localeCompare(right)).slice(-4);
    if (!sortedKeys.length) {
      return [];
    }

    return sortedKeys.map((monthKey) => ({
      monthLabel: this.toMonthLabel(monthKey),
      appointments: appointments.filter((appointment) => this.toMonthKey(appointment.startsAt) === monthKey).length,
      invoices: invoices.filter((invoice) => this.toMonthKey(invoice.issuedAt) === monthKey).length,
      messages: threads.filter((thread) => this.toMonthKey(thread.updatedAt) === monthKey).length
    }));
  }

  private toMonthKey(value: string): string {
    return value.slice(0, 7);
  }

  private toMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-').map((entry) => Number(entry));
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
