// donation.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {BackEndRoutesService} from "../back-end.routes.service";
import {DonationRequest, DonationResponse} from "../dtos/donation/donationDto";


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


  donate(request: DonationRequest, token: string): Observable<DonationResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<DonationResponse>(
      `${this.baseUrl}/donate`,
      request,
      { headers }
    );
  }


}
