import {
  AppNotification,
  Appointment,
  DoctorProfile,
  EncounterNote,
  Invoice,
  MedicalReport,
  MessageThread,
  Prescription,
  User
} from '../models/healthcare.models';

export const usersSeed: User[] = [
  {
    id: 'p-001',
    fullName: 'Kavya Sharma',
    email: 'kavya.sharma@healthcare.com',
    password: 'Patient@123',
    role: 'patient',
    isActive: true,
    phone: '+91 9876543210',
    bloodGroup: 'B+',
    emergencyContact: '+91 9000011111'
  },
  {
    id: 'p-002',
    fullName: 'Ravi Nair',
    email: 'ravi.nair@healthcare.com',
    password: 'Patient@123',
    role: 'patient',
    isActive: true,
    phone: '+91 9898989898',
    bloodGroup: 'O+',
    emergencyContact: '+91 9123456789'
  },
  {
    id: 'd-001',
    fullName: 'Dr. Arjun Mehra',
    email: 'arjun.mehra@healthcare.com',
    password: 'Doctor@123',
    role: 'doctor',
    isActive: true
  },
  {
    id: 'd-002',
    fullName: 'Dr. Nisha Patel',
    email: 'nisha.patel@healthcare.com',
    password: 'Doctor@123',
    role: 'doctor',
    isActive: true
  },
  {
    id: 'a-001',
    fullName: 'Priya Verma',
    email: 'priya.verma@healthcare.com',
    password: 'Admin@123',
    role: 'admin',
    isActive: true
  }
];

export const doctorProfilesSeed: DoctorProfile[] = [
  {
    id: 'dp-001',
    userId: 'd-001',
    specialization: 'Cardiology',
    experienceYears: 11,
    consultationFee: 1200,
    languages: ['English', 'Hindi'],
    availableDays: ['Mon', 'Wed', 'Fri'],
    shiftStart: '09:00',
    shiftEnd: '16:00',
    acceptingAppointments: true,
    rating: 4.8
  },
  {
    id: 'dp-002',
    userId: 'd-002',
    specialization: 'General Medicine',
    experienceYears: 8,
    consultationFee: 900,
    languages: ['English', 'Hindi', 'Marathi'],
    availableDays: ['Tue', 'Thu', 'Sat'],
    shiftStart: '10:00',
    shiftEnd: '18:00',
    acceptingAppointments: true,
    rating: 4.6
  }
];

export const appointmentsSeed: Appointment[] = [
  {
    id: 'ap-001',
    patientId: 'p-001',
    doctorId: 'd-001',
    startsAt: '2026-04-21T17:30:00.000Z',
    status: 'scheduled',
    mode: 'virtual',
    reason: 'Follow-up consultation'
  },
  {
    id: 'ap-002',
    patientId: 'p-001',
    doctorId: 'd-002',
    startsAt: '2026-04-22T10:15:00.000Z',
    status: 'scheduled',
    mode: 'in-clinic',
    reason: 'Routine examination'
  },
  {
    id: 'ap-003',
    patientId: 'p-002',
    doctorId: 'd-001',
    startsAt: '2026-04-20T09:00:00.000Z',
    status: 'completed',
    mode: 'in-clinic',
    reason: 'Cardiology review'
  }
];

export const prescriptionsSeed: Prescription[] = [
  {
    id: 'pr-001',
    appointmentId: 'ap-001',
    patientId: 'p-001',
    doctorId: 'd-001',
    issuedAt: '2026-04-19T09:30:00.000Z',
    medication: 'Amlodipine',
    dosage: '5 mg once daily',
    durationDays: 30,
    instructions: 'Take after breakfast and continue daily blood pressure logging.'
  },
  {
    id: 'pr-002',
    appointmentId: 'ap-002',
    patientId: 'p-001',
    doctorId: 'd-002',
    issuedAt: '2026-04-15T10:00:00.000Z',
    medication: 'Vitamin D3',
    dosage: '60k IU weekly',
    durationDays: 56,
    instructions: 'One sachet weekly after dinner for eight weeks.'
  }
];

export const reportsSeed: MedicalReport[] = [
  {
    id: 'rp-001',
    patientId: 'p-001',
    doctorId: 'd-001',
    reportType: 'Lipid Profile',
    createdAt: '2026-04-20T06:00:00.000Z',
    status: 'pending'
  },
  {
    id: 'rp-002',
    patientId: 'p-002',
    doctorId: 'd-001',
    reportType: 'ECG',
    createdAt: '2026-04-18T06:00:00.000Z',
    status: 'ready'
  }
];

export const invoicesSeed: Invoice[] = [
  {
    id: 'inv-001',
    patientId: 'p-001',
    amount: 1850,
    issuedAt: '2026-04-18T10:00:00.000Z',
    status: 'pending'
  },
  {
    id: 'inv-002',
    patientId: 'p-001',
    amount: 920,
    issuedAt: '2026-04-11T10:00:00.000Z',
    status: 'paid'
  },
  {
    id: 'inv-003',
    patientId: 'p-002',
    amount: 2410,
    issuedAt: '2026-04-04T10:00:00.000Z',
    status: 'overdue'
  }
];

export const messageThreadsSeed: MessageThread[] = [
  {
    id: 'th-001',
    patientId: 'p-001',
    doctorId: 'd-001',
    lastMessage: 'Please continue medication and share your BP logs tomorrow.',
    unreadCount: 1,
    updatedAt: '2026-04-20T12:40:00.000Z',
    messages: [
      {
        id: 'msg-001',
        senderId: 'p-001',
        senderRole: 'patient',
        content: 'My blood pressure readings were stable over the weekend.',
        sentAt: '2026-04-20T12:15:00.000Z'
      },
      {
        id: 'msg-002',
        senderId: 'd-001',
        senderRole: 'doctor',
        content: 'Please continue medication and share your BP logs tomorrow.',
        sentAt: '2026-04-20T12:40:00.000Z'
      }
    ]
  },
  {
    id: 'th-002',
    patientId: 'p-002',
    doctorId: 'd-002',
    lastMessage: 'Your routine review can stay virtual if symptoms remain stable.',
    unreadCount: 0,
    updatedAt: '2026-04-18T10:20:00.000Z',
    messages: [
      {
        id: 'msg-003',
        senderId: 'd-002',
        senderRole: 'doctor',
        content: 'Your routine review can stay virtual if symptoms remain stable.',
        sentAt: '2026-04-18T10:20:00.000Z'
      }
    ]
  }
];

export const encounterNotesSeed: EncounterNote[] = [
  {
    id: 'en-001',
    appointmentId: 'ap-003',
    patientId: 'p-002',
    doctorId: 'd-001',
    createdAt: '2026-04-20T09:45:00.000Z',
    title: 'Cardiology Follow-Up Review',
    summary: 'Patient reports improved exercise tolerance and stable home blood pressure readings.',
    diagnosis: 'Hypertension remains controlled on current medication regimen.',
    followUpInstructions: 'Continue current regimen and review in six weeks with updated lipid panel.'
  }
];

export const notificationsSeed: AppNotification[] = [
  {
    id: 'nt-001',
    recipientId: 'p-001',
    category: 'system',
    title: 'Profile Completion Reminder',
    body: 'Please verify your emergency contact details before your next visit.',
    createdAt: '2026-04-21T07:30:00.000Z',
    read: false,
    priority: 'medium'
  },
  {
    id: 'nt-002',
    recipientRole: 'doctor',
    category: 'message',
    title: 'Unread Conversations',
    body: 'You have conversations with unread patient messages.',
    createdAt: '2026-04-21T08:00:00.000Z',
    read: false,
    priority: 'medium'
  },
  {
    id: 'nt-003',
    recipientRole: 'admin',
    category: 'system',
    title: 'Daily Operations Digest',
    body: 'Review scheduled appointments and overdue invoices before 6 PM.',
    createdAt: '2026-04-21T08:30:00.000Z',
    read: false,
    priority: 'high'
  }
];
