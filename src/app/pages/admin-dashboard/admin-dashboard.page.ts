import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';
import { Appointment, DoctorProfile, User } from '../../core/models/healthcare.models';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss'
})
export class AdminDashboardPageComponent implements OnInit {
  protected totalUsers = 0;
  protected totalDoctors = 0;
  protected totalPatients = 0;
  protected inactiveUsers = 0;
  protected appointmentsToday = 0;
  protected openBillingTickets = 0;
  protected completionRate = 0;
  protected readonly operationsFeed: string[] = [];
  protected readonly appointmentOperations: Array<{
    id: string;
    patientId: string;
    doctorId: string;
    patientName: string;
    doctorName: string;
    startsAtIso: string;
    startsAtLabel: string;
    status: string;
    mode: string;
    reason: string;
  }> = [];
  protected readonly filteredAppointmentOperations: Array<{
    id: string;
    patientId: string;
    doctorId: string;
    patientName: string;
    doctorName: string;
    startsAtIso: string;
    startsAtLabel: string;
    status: string;
    mode: string;
    reason: string;
  }> = [];
  protected readonly availableDoctors: Array<{ id: string; name: string }> = [];
  protected selectedAppointmentFilter: 'all' | 'requested' | 'scheduled' | 'rescheduled' | 'completed' | 'cancelled' = 'all';
  protected selectedAppointmentId = '';
  protected selectedDoctorId = '';
  protected selectedRescheduleAt = '';
  protected appointmentMessage = '';
  protected appointmentError = '';
  protected readonly managedUsers: Array<{
    id: string;
    fullName: string;
    email: string;
    role: 'patient' | 'doctor';
    isActive: boolean;
    specialization: string;
    phone: string;
  }> = [];
  protected selectedRoleFilter: 'all' | 'patient' | 'doctor' = 'all';
  protected accountMessage = '';
  protected accountError = '';

  protected newRole: 'patient' | 'doctor' = 'patient';
  protected newFullName = '';
  protected newEmail = '';
  protected newPassword = 'Welcome@123';
  protected newPhone = '';
  protected newSpecialization = '';

  private usersStore: User[] = [];
  private readonly doctorProfilesMap = new Map<string, DoctorProfile>();

  constructor(private readonly healthcareDataService: HealthcareDataService) {}

  ngOnInit(): void {
    this.healthcareDataService.getUsers().subscribe((users) => {
      this.usersStore = users;
      this.totalUsers = users.length;
      this.totalPatients = users.filter((user) => user.role === 'patient').length;
      this.totalDoctors = users.filter((user) => user.role === 'doctor').length;
      this.inactiveUsers = users.filter((user) => !user.isActive).length;
      this.availableDoctors.splice(
        0,
        this.availableDoctors.length,
        ...users
          .filter((user) => user.role === 'doctor' && user.isActive)
          .sort((left, right) => left.fullName.localeCompare(right.fullName))
          .map((user) => ({ id: user.id, name: user.fullName }))
      );
      this.refreshManagedUsers();
      this.refreshAppointmentOperations();
    });

    this.healthcareDataService.getDoctorProfiles().subscribe((profiles) => {
      this.doctorProfilesMap.clear();
      profiles.forEach((profile) => this.doctorProfilesMap.set(profile.userId, profile));
      this.refreshManagedUsers();
    });

    this.healthcareDataService.getAppointments().subscribe((appointments) => {
      const today = new Date().toDateString();
      const todaysAppointments = appointments.filter((appointment) => new Date(appointment.startsAt).toDateString() === today);
      const completedAppointments = todaysAppointments.filter((appointment) => appointment.status === 'completed').length;

      this.appointmentsToday = todaysAppointments.length;
      this.completionRate = todaysAppointments.length
        ? Math.round((completedAppointments / todaysAppointments.length) * 100)
        : 0;

      this.appointmentOperations.splice(
        0,
        this.appointmentOperations.length,
        ...appointments
          .slice()
          .sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime())
          .map((appointment) => this.mapAppointmentOperation(appointment))
      );
      this.applyAppointmentFilter(this.selectedAppointmentFilter);
      this.refreshSelectedAppointmentState();
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

  protected applyRoleFilter(filter: 'all' | 'patient' | 'doctor'): void {
    this.selectedRoleFilter = filter;
    this.refreshManagedUsers();
  }

  protected toggleUserStatus(user: { id: string; fullName: string; isActive: boolean }): void {
    const updated = this.healthcareDataService.setUserActiveStatus(user.id, !user.isActive);

    if (!updated) {
      this.accountError = 'Account status update could not be completed.';
      this.accountMessage = '';
      return;
    }

    this.accountMessage = `${updated.fullName} has been ${updated.isActive ? 'activated' : 'deactivated'}.`;
    this.accountError = '';
  }

  protected createAccount(): void {
    if (!this.newFullName.trim() || !this.newEmail.trim() || !this.newPassword.trim()) {
      this.accountError = 'Name, email, and password are required to create an account.';
      this.accountMessage = '';
      return;
    }

    if (this.newRole === 'doctor' && !this.newSpecialization.trim()) {
      this.accountError = 'Specialization is required for doctor onboarding.';
      this.accountMessage = '';
      return;
    }

    try {
      this.healthcareDataService.createManagedUser({
        fullName: this.newFullName,
        email: this.newEmail,
        password: this.newPassword,
        role: this.newRole,
        phone: this.newPhone,
        specialization: this.newSpecialization
      });

      this.accountMessage = `${this.newRole === 'doctor' ? 'Doctor' : 'Patient'} account created successfully.`;
      this.accountError = '';
      this.operationsFeed.unshift(`New ${this.newRole} account onboarded: ${this.newFullName.trim()}.`);
      this.newFullName = '';
      this.newEmail = '';
      this.newPassword = 'Welcome@123';
      this.newPhone = '';
      this.newSpecialization = '';
    } catch {
      this.accountError = 'Account creation failed. Check whether the email already exists.';
      this.accountMessage = '';
    }
  }

  protected applyAppointmentFilter(filter: 'all' | 'requested' | 'scheduled' | 'rescheduled' | 'completed' | 'cancelled'): void {
    this.selectedAppointmentFilter = filter;
    this.filteredAppointmentOperations.splice(
      0,
      this.filteredAppointmentOperations.length,
      ...this.appointmentOperations.filter((appointment) => filter === 'all' || appointment.status === filter)
    );
  }

  protected openAppointmentEditor(appointment: { id: string; doctorId: string; startsAtIso: string }): void {
    this.selectedAppointmentId = appointment.id;
    this.selectedDoctorId = appointment.doctorId;
    this.selectedRescheduleAt = this.toDateTimeLocal(appointment.startsAtIso);
    this.appointmentMessage = '';
    this.appointmentError = '';
  }

  protected updateAppointmentStatus(appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled'): void {
    this.healthcareDataService.updateAppointmentStatus(appointmentId, status);
    this.appointmentMessage = `Appointment status updated to ${status}.`;
    this.appointmentError = '';
  }

  protected reassignAppointment(): void {
    if (!this.selectedAppointmentId || !this.selectedDoctorId) {
      this.appointmentError = 'Select an appointment and a doctor before reassignment.';
      this.appointmentMessage = '';
      return;
    }

    try {
      this.healthcareDataService.reassignAppointmentDoctor(this.selectedAppointmentId, this.selectedDoctorId);
      this.appointmentMessage = 'Appointment reassigned successfully.';
      this.appointmentError = '';
    } catch {
      this.appointmentError = 'Appointment reassignment failed for the selected doctor.';
      this.appointmentMessage = '';
    }
  }

  protected rescheduleAppointment(): void {
    if (!this.selectedAppointmentId || !this.selectedRescheduleAt) {
      this.appointmentError = 'Select an appointment and choose a new date/time.';
      this.appointmentMessage = '';
      return;
    }

    try {
      this.healthcareDataService.adminRescheduleAppointment(this.selectedAppointmentId, this.selectedRescheduleAt);
      this.appointmentMessage = 'Appointment rescheduled successfully.';
      this.appointmentError = '';
    } catch {
      this.appointmentError = 'Appointment reschedule failed for the selected slot.';
      this.appointmentMessage = '';
    }
  }

  private refreshManagedUsers(): void {
    this.managedUsers.splice(
      0,
      this.managedUsers.length,
      ...this.usersStore
        .filter((user): user is User & { role: 'doctor' | 'patient' } => user.role === 'doctor' || user.role === 'patient')
        .filter((user) => this.selectedRoleFilter === 'all' || user.role === this.selectedRoleFilter)
        .sort((left, right) => left.fullName.localeCompare(right.fullName))
        .map((user) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          specialization: this.doctorProfilesMap.get(user.id)?.specialization ?? 'Not applicable',
          phone: user.phone ?? 'Not available'
        }))
    );
  }

  private refreshAppointmentOperations(): void {
    if (!this.appointmentOperations.length) {
      this.filteredAppointmentOperations.splice(0, this.filteredAppointmentOperations.length);
      return;
    }

    this.applyAppointmentFilter(this.selectedAppointmentFilter);
  }

  private refreshSelectedAppointmentState(): void {
    if (!this.selectedAppointmentId) {
      return;
    }

    const selected = this.appointmentOperations.find((entry) => entry.id === this.selectedAppointmentId);
    if (!selected) {
      this.selectedAppointmentId = '';
      this.selectedDoctorId = '';
      this.selectedRescheduleAt = '';
      return;
    }

    this.selectedDoctorId = selected.doctorId;
    this.selectedRescheduleAt = this.toDateTimeLocal(selected.startsAtIso);
  }

  private mapAppointmentOperation(appointment: Appointment): {
    id: string;
    patientId: string;
    doctorId: string;
    patientName: string;
    doctorName: string;
    startsAtIso: string;
    startsAtLabel: string;
    status: string;
    mode: string;
    reason: string;
  } {
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      patientName: this.resolveUserName(appointment.patientId),
      doctorName: this.resolveUserName(appointment.doctorId),
      startsAtIso: appointment.startsAt,
      startsAtLabel: new Date(appointment.startsAt).toLocaleString(),
      status: appointment.status,
      mode: appointment.mode,
      reason: appointment.reason
    };
  }

  private resolveUserName(userId: string): string {
    return this.usersStore.find((user) => user.id === userId)?.fullName ?? 'User';
  }

  private toDateTimeLocal(isoDate: string): string {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
