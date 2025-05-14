// donation.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {BackEndRoutesService} from "../back-end.routes.service";

export interface DonationRequest {
  amount: number;
}

export interface DonationResponse {
  initPoint: string;
  donationId: number;
}

@Injectable({
  providedIn: 'root'
})
export class DonationService {

  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private routeService: BackEndRoutesService
  ) {
    this.baseUrl = this.routeService.donationsServiceUrl;
  }

  createDonation(token: string, amount: number): Observable<DonationResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const body: DonationRequest = { amount };

    return this.http.post<DonationResponse>(
      `${this.baseUrl}/api/donate`,
      body,
      { headers }
    );
  }
}
