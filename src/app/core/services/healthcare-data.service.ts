import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
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

  getUsers(): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  getUsersSnapshot(): User[] {
    return this.usersSubject.value;
  }

  findUserByEmail(email: string): User | undefined {
    const normalizedEmail = email.trim().toLowerCase();
    return this.usersSubject.value.find((user) => user.email.toLowerCase() === normalizedEmail);
  }

  addUser(user: User): void {
    this.usersSubject.next([...this.usersSubject.value, user]);
  }

  getDoctorProfiles(): Observable<DoctorProfile[]> {
    return of(doctorProfilesSeed);
  }

  getAppointments(): Observable<Appointment[]> {
    return of(appointmentsSeed);
  }

  getAppointmentsForPatient(patientId: string): Observable<Appointment[]> {
    return of(appointmentsSeed.filter((appointment) => appointment.patientId === patientId));
  }

  getAppointmentsForDoctor(doctorId: string): Observable<Appointment[]> {
    return of(appointmentsSeed.filter((appointment) => appointment.doctorId === doctorId));
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
