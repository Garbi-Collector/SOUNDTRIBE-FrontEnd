import { Component, OnInit, HostListener } from '@angular/core';
import { NotificationGet, NotificationType } from '../../dtos/noti/NotificationsDto';
import { NotificationService } from '../../services/notification.service';
import { NotificationRedirectService } from '../../services/notification-redirect.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.css']
})
export class NotificationModalComponent implements OnInit {
  notifications: NotificationGet[] = [];
  isOpen = false;
  unreadCount = 0;

  constructor(
    private notificationService: NotificationService,
    private notificationRedirectService: NotificationRedirectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado de autenticación
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadNotifications();
      } else {
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  loadNotifications(): void {
    const token = this.authService.getToken();
    if (token) {
      this.notificationService.getMyNotifications(token).subscribe(
        (notifications) => {
          this.notifications = notifications;
          this.calculateUnreadCount();
        },
        (error) => {
          console.error('Error al cargar notificaciones:', error);
        }
      );
    }
  }

  toggleNotifications(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isOpen = !this.isOpen;

    // Si abrimos el modal, actualizamos las notificaciones
    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  onNotificationClick(notification: NotificationGet): void {
    // Redirigir basado en el tipo de notificación
    this.notificationRedirectService.redirectBasedOnNotification(notification);
    this.isOpen = false;
  }

  getIconForNotificationType(type: NotificationType): string {
    const iconMap: Record<NotificationType, string> = {
      'DONATION': 'bi-cash',
      'RECORD': 'bi-music-note',
      'NEW_ALBUM': 'bi-disc',
      'FOLLOW': 'bi-person-plus',
      'LIKE_SONG': 'bi-heart',
      'LIKE_ALBUM': 'bi-heart-fill'
    };

    return iconMap[type] || 'bi-bell';
  }

  getTimeAgo(id: number): string {
    // Por ahora dejamos un placeholder
    // En una implementación real, se calcularía basado en la marca de tiempo de la notificación
    return 'hace 5 minutos';
  }

  calculateUnreadCount(): number {
    // Simplemente contamos todas las notificaciones como no leídas
    // ya que no tenemos un campo de "leído" en el DTO
    this.unreadCount = this.notifications.length;
    return this.unreadCount;
  }

  markAllAsRead(): void {
    // Esto es un placeholder para la función de marcar todas como leídas
    // En una implementación real, se haría una llamada al backend
    this.unreadCount = 0;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    // Cerrar el dropdown cuando se hace clic afuera
    const notificationElement = document.querySelector('.notification-icon');
    if (this.isOpen && notificationElement && !notificationElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }
}
