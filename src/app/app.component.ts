import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService, ModalType } from "./services/modal.service";
import { PlayerService, PlayerState } from "./services/player.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'SOUNDTRIBE-FrontEnd';

  modalType = ModalType.None;
  ModalType = ModalType;

  // Estado del reproductor
  playerState: PlayerState | null = null;
  hasCurrentSong = false;
  isMobile = false;

  private playerSubscription?: Subscription;

  constructor(
    private modalService: ModalService,
    private playerService: PlayerService
  ) {
    this.modalService.modalType$.subscribe(type => {
      this.modalType = type;
    });
  }

  ngOnInit() {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');

    // Detectar si es móvil
    this.checkIsMobile();

    // Suscribirse al estado del reproductor
    this.playerSubscription = this.playerService.playerState$.subscribe(state => {
      this.playerState = state;
      this.hasCurrentSong = !!(state?.currentSong);
    });

    // Escuchar cambios de tamaño de ventana para detectar móvil
    window.addEventListener('resize', () => {
      this.checkIsMobile();
    });
  }

  ngOnDestroy(): void {
    if (this.playerSubscription) {
      this.playerSubscription.unsubscribe();
    }
  }

  /**
   * Detectar si el dispositivo es móvil
   */
  private checkIsMobile(): void {
    this.isMobile = window.innerWidth <= 768; // Puedes ajustar este breakpoint
  }

  /**
   * Determinar si se deben mostrar los <br> adicionales
   */
  shouldShowExtraBreaks(): boolean {
    return this.isMobile && this.hasCurrentSong;
  }
}
