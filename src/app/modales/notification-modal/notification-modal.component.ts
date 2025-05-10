import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router'; // IMPORTANTE: Importar Router
import { NotificationGet, NotificationType } from '../../dtos/noti/NotificationsDto';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from "rxjs";

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
    private authService: AuthService,
    private router: Router // IMPORTANTE: Inyectar Router
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
    const token = this.authService.getToken();
    if (!notification.isRead && token) {
      this.notificationService.markAsRead(notification.id, token).subscribe(() => {
        notification.isRead = true;
        this.calculateUnreadCount();
      });
    }

    console.log('Slug de notificación:', notification.slug);
    console.log('Tipo de notificación:', notification.type);

    this.redirectBasedOnNotification(notification);

    // Cerramos el modal después de hacer clic
    this.isOpen = false;
  }

  redirectBasedOnNotification(notification: NotificationGet): void {
    if (!notification.slug) {
      console.error('Slug de notificación no disponible');
      return;
    }

    const typesThatGoToProfile = ['DONATION', 'RECORD', 'FOLLOW', 'LIKE_SONG'];

    try {
      if (typesThatGoToProfile.includes(notification.type)) {
        console.log('Redirigiendo a perfil:', notification.slug);
        this.router.navigate(['/perfil', notification.slug]);
      } else {
        console.log('Redirigiendo a álbum:', notification.slug);
        this.router.navigate(['/album', notification.slug]);
      }
    } catch (error) {
      console.error('Error en la redirección:', error);
    }
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
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    return this.unreadCount;
  }

  markAllAsRead(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    const requests = unreadNotifications.map(n =>
      this.notificationService.markAsRead(n.id, token)
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: err => console.error('Error al marcar como leídas', err)
    });
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
