import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DonationService } from '../../services/donation.service';

@Component({
  selector: 'app-donation-success',
  templateUrl: './donation-success.component.html',
  styleUrls: ['./donation-success.component.css']
})
export class DonationSuccessComponent implements OnInit {
  donationId: string | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private donationService: DonationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.donationId = params['donationId'];

      // Mostrar URL relativa
      console.log('URL relativa:', this.router.url);

      // Mostrar URL completa (incluye protocolo, host, etc.)
      console.log('URL completa:', window.location.href);

      if (this.donationId) {
        setTimeout(() => {
          this.isLoading = false;
        }, 1500);
      } else {
        this.errorMessage = 'No se pudo identificar la donación';
        this.isLoading = false;
      }
    });
  }


  goToHome(): void {
    this.router.navigate(['/inicio']);
  }

  goToDonate(): void {
    this.router.navigate(['/donation']);
  }
}
