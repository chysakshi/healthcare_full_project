import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Appointment, DoctorProfile, User } from '../../core/models/healthcare.models';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';

@Component({
  selector: 'app-doctor-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './doctor-profile.page.html',
  styleUrl: './doctor-profile.page.scss'
})
export class DoctorProfilePageComponent implements OnInit {
  protected doctor: User | null = null;
  protected profile: DoctorProfile | null = null;
  protected readonly upcomingSlots: string[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly healthcareDataService: HealthcareDataService
  ) {}

  ngOnInit(): void {
    const doctorUserId = this.route.snapshot.paramMap.get('doctorId');
    if (!doctorUserId) {
      return;
    }

    this.healthcareDataService.getDoctorProfileByUserId(doctorUserId).subscribe((entry) => {
      this.doctor = entry?.user ?? null;
      this.profile = entry?.profile ?? null;
    });

    this.healthcareDataService.getAppointmentsForDoctor(doctorUserId).subscribe((appointments) => {
      const slots = appointments
        .filter((appointment) => appointment.status === 'scheduled')
        .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
        .slice(0, 5)
        .map((appointment) => this.formatSlot(appointment));

      this.upcomingSlots.splice(0, this.upcomingSlots.length, ...slots);
    });
  }

  private formatSlot(appointment: Appointment): string {
    return `${new Date(appointment.startsAt).toLocaleString()} | ${appointment.mode} | ${appointment.reason}`;
  }
}
