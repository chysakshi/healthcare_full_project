export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialization: string;
  experienceYears: number;
}

export type AppointmentStatus = 'scheduled' | 'checked-in' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  startsAt: string;
  status: AppointmentStatus;
  mode: 'in-clinic' | 'virtual';
  reason: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  issuedAt: string;
  medication: string;
  dosage: string;
  durationDays: number;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  doctorId: string;
  reportType: string;
  createdAt: string;
  status: 'pending' | 'ready';
}

export interface Invoice {
  id: string;
  patientId: string;
  amount: number;
  issuedAt: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface MessageThread {
  id: string;
  patientId: string;
  doctorId: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
}
