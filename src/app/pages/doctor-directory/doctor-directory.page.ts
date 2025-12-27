import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DoctorProfile, User } from '../../core/models/healthcare.models';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';

interface DirectoryDoctor {
  user: User;
  profile: DoctorProfile;
}

@Component({
  selector: 'app-doctor-directory-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './doctor-directory.page.html',
  styleUrl: './doctor-directory.page.scss'
})
export class DoctorDirectoryPageComponent implements OnInit {
  protected readonly doctors: DirectoryDoctor[] = [];

  constructor(private readonly healthcareDataService: HealthcareDataService) {}

  ngOnInit(): void {
    this.healthcareDataService.getDoctorDirectory().subscribe((directory) => {
      this.doctors.splice(0, this.doctors.length, ...directory);
    });
  }
}
