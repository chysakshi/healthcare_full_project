import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import {
  Appointment,
  DoctorProfile,
  Invoice,
  MedicalReport,
  MessageThread,
  Prescription,
  User
} from '../models/healthcare.models';
import {
  appointmentsSeed,
  doctorProfilesSeed,
  invoicesSeed,
  messageThreadsSeed,
  prescriptionsSeed,
  reportsSeed,
  usersSeed
} from '../data/healthcare.seed';

@Injectable({
  providedIn: 'root'
})
export class HealthcareDataService {
  private readonly usersSubject = new BehaviorSubject<User[]>([...usersSeed]);
  private readonly appointmentsSubject = new BehaviorSubject<Appointment[]>([...appointmentsSeed]);

  getUsers(): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  getUsersSnapshot(): User[] {
    return this.usersSubject.value;
  }

  getUserById(userId: string): User | undefined {
    return this.usersSubject.value.find((user) => user.id === userId);
  }

  findUserByEmail(email: string): User | undefined {
    const normalizedEmail = email.trim().toLowerCase();
    return this.usersSubject.value.find((user) => user.email.toLowerCase() === normalizedEmail);
  }

  addUser(user: User): void {
    this.usersSubject.next([...this.usersSubject.value, user]);
  }

  updateUser(userId: string, changes: Partial<User>): User | null {
    let updatedUser: User | null = null;

    this.usersSubject.next(
      this.usersSubject.value.map((user) => {
        if (user.id !== userId) {
          return user;
        }

        updatedUser = { ...user, ...changes };
        return updatedUser;
      })
    );

    return updatedUser;
  }

  getDoctorProfiles(): Observable<DoctorProfile[]> {
    return of(doctorProfilesSeed);
  }

  getDoctorDirectory(): Observable<Array<{ user: User; profile: DoctorProfile }>> {
    const doctors = this.usersSubject.value.filter((user) => user.role === 'doctor' && user.isActive);
    const directory = doctors
      .map((doctor) => {
        const profile = doctorProfilesSeed.find((entry) => entry.userId === doctor.id);
        return profile ? { user: doctor, profile } : undefined;
      })
      .filter((entry): entry is { user: User; profile: DoctorProfile } => !!entry);

    return of(directory);
  }

  getDoctorProfileByUserId(userId: string): Observable<{ user: User; profile: DoctorProfile } | null> {
    const user = this.usersSubject.value.find((entry) => entry.id === userId && entry.role === 'doctor');
    const profile = doctorProfilesSeed.find((entry) => entry.userId === userId);

    if (!user || !profile) {
      return of(null);
    }

    return of({ user, profile });
  }

  getAppointments(): Observable<Appointment[]> {
    return this.appointmentsSubject.asObservable();
  }

  getAppointmentsForPatient(patientId: string): Observable<Appointment[]> {
    return this.appointmentsSubject
      .asObservable()
      .pipe(map((appointments) => appointments.filter((appointment) => appointment.patientId === patientId)));
  }

  getAppointmentsForDoctor(doctorId: string): Observable<Appointment[]> {
    return this.appointmentsSubject
      .asObservable()
      .pipe(map((appointments) => appointments.filter((appointment) => appointment.doctorId === doctorId)));
  }

  createAppointment(payload: {
    patientId: string;
    doctorId: string;
    startsAt: string;
    mode: 'in-clinic' | 'virtual';
    reason: string;
  }): Appointment {
    const appointment: Appointment = {
      id: `ap-${Date.now()}`,
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      startsAt: payload.startsAt,
      status: 'requested',
      mode: payload.mode,
      reason: payload.reason.trim()
    };

    this.appointmentsSubject.next([appointment, ...this.appointmentsSubject.value]);
    return appointment;
  }

  updateAppointmentStatus(appointmentId: string, status: Appointment['status']): void {
    this.appointmentsSubject.next(
      this.appointmentsSubject.value.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, status } : appointment
      )
    );
  }

  rescheduleAppointment(appointmentId: string, startsAt: string): void {
    this.appointmentsSubject.next(
      this.appointmentsSubject.value.map((appointment) =>
        appointment.id === appointmentId
          ? {
              ...appointment,
              startsAt,
              status: 'rescheduled'
            }
          : appointment
      )
    );
  }

  getPrescriptionsForPatient(patientId: string): Observable<Prescription[]> {
    return of(prescriptionsSeed.filter((prescription) => prescription.patientId === patientId));
  }

  getReportsForPatient(patientId: string): Observable<MedicalReport[]> {
    return of(reportsSeed.filter((report) => report.patientId === patientId));
  }

  getInvoicesForPatient(patientId: string): Observable<Invoice[]> {
    return of(invoicesSeed.filter((invoice) => invoice.patientId === patientId));
  }

  getMessageThreads(): Observable<MessageThread[]> {
    return of(messageThreadsSeed);
  }

  getPrescriptions(): Observable<Prescription[]> {
    return of(prescriptionsSeed);
  }

  getReports(): Observable<MedicalReport[]> {
    return of(reportsSeed);
  }

  getInvoices(): Observable<Invoice[]> {
    return of(invoicesSeed);
  }
}
