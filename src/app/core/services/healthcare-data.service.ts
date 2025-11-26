import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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
  getUsers(): Observable<User[]> {
    return of(usersSeed);
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
