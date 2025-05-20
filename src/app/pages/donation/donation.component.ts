import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DonationService } from '../../services/donation.service';
import { ModalService, ModalType } from '../../services/modal.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DonationRequest } from '../../dtos/donation/donationDto';

@Component({
  selector: 'app-donation',
  templateUrl: './donation.component.html',
  styleUrls: ['./donation.component.css']
})
export class DonationComponent implements OnInit {
  donationForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  customAmount = false;

  // Opciones de donación predefinidas
  donationOptions = [
    { value: 10, label: '$10' },
    { value: 50, label: '$50' },
    { value: 100, label: '$100' },
    { value: 200, label: '$200' },
    { value: 500, label: '$500' },
    { value: 1000, label: '$1000' },
    { value: 'custom', label: 'Otra cantidad' }
  ];

  constructor(
    private fb: FormBuilder,
    private donationService: DonationService,
    private modalService: ModalService,
    private router: Router,
    private authService: AuthService
  ) {
    this.donationForm = this.fb.group({
      amount: [null, [Validators.required]],
      customAmount: [null, [Validators.min(1000.01), Validators.pattern(/^\d+(\.\d{2})$/)]],
      message: ['', [Validators.maxLength(25)]],
      termsAccepted: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
  }

  onAmountChange(value: number | string): void {
    if (value === 'custom') {
      this.customAmount = true;
    } else {
      this.customAmount = false;
      this.donationForm.get('customAmount')?.setValue(null);
    }
  }

  openTermsModal(): void {
    this.modalService.openModal(ModalType.TermsOfDonation);
  }

  onSubmit(): void {
    if (this.donationForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const selectedAmount = this.donationForm.get('amount')?.value;
    const customAmountValue = this.donationForm.get('customAmount')?.value;
    const message = this.donationForm.get('message')?.value;

    // Determinar el monto final
    const finalAmount = selectedAmount === 'custom' ? customAmountValue : selectedAmount;

    const token = this.authService.getToken();
    if (!token) {
      this.errorMessage = 'Debe iniciar sesión para realizar una donación';
      this.isSubmitting = false;
      return;
    }

    const donationRequest: DonationRequest = {
      amount: finalAmount,
      mensaje: message,
    };

    this.donationService.donate(donationRequest, token).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Procesando su donación...';

        // Redirigir al usuario a la URL de Mercado Pago
        window.location.href = response.initPoint;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Ha ocurrido un error al procesar la donación';
      }
    });
  }
}
