import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackEndRoutesService } from '../back-end.routes.service';
import { NotificationGet } from '../dtos/noti/NotificationsDto';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private backEndRoutes: BackEndRoutesService
  ) {
    this.baseUrl = `${this.backEndRoutes.notificationServiceUrl}/notifications`;
  }

  getMyNotifications(token: string): Observable<NotificationGet[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<NotificationGet[]>(`${this.baseUrl}/getmy`, { headers });
  }

  markAsRead(notificationId: number, token: string): Observable<string> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.patch<string>(`${this.baseUrl}/${notificationId}/read`, null, { headers });
  }
}
