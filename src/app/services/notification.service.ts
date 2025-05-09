// notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackEndRoutesService } from '../back-end.routes.service';
import {NotificationGet} from "../dtos/noti/NotificationsDto";



@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly url: string;

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService
  ) {
    this.url = `${this.backEndRoutes.notificationServiceUrl}/notifications/getmy`;
  }

  getMyNotifications(token: string): Observable<NotificationGet[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<NotificationGet[]>(this.url, { headers });
  }




}
