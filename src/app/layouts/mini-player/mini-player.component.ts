import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-mini-player',
  templateUrl: './mini-player.component.html',
  styleUrls: ['./mini-player.component.css']
})
export class MiniPlayerComponent implements OnInit {
  // Estados del reproductor
  isPlaying: boolean = false;
  isExpanded: boolean = false;
  isLiked: boolean = false;

  // Información de tiempo
  currentTime: string = '0:00';
  totalTime: string = '2:30';
  progressPercentage: number = 0;

  constructor() { }

  ngOnInit(): void {
    // Inicializar componente
    // Aquí se cargaría la información de la canción actual si existiera
  }

  // Métodos para controlar la reproducción
  togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    // Aquí iría la lógica para reproducir/pausar la canción
  }

  previousTrack(): void {
    // Lógica para ir a la canción anterior
    console.log('Canción anterior');
  }

  nextTrack(): void {
    // Lógica para ir a la siguiente canción
    console.log('Siguiente canción');
  }

  // Métodos para acciones adicionales
  toggleLike(): void {
    this.isLiked = !this.isLiked;
  }

  dislike(): void {
    // Lógica para eliminar de favoritos o dislike
    this.isLiked = false;
    console.log('Dislike/Eliminar de favoritos');
  }

  // Método para expandir/contraer el reproductor
  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    // Aquí puedes añadir lógica adicional cuando se expande/contrae
  }

  // Método para actualizar el progreso de la canción (sería llamado por un intervalo o un observable)
  updateProgress(currentSeconds: number, totalSeconds: number): void {
    this.currentTime = this.formatTime(currentSeconds);
    this.totalTime = this.formatTime(totalSeconds);
    this.progressPercentage = (currentSeconds / totalSeconds) * 100;
  }

  // Método para formatear segundos a formato mm:ss
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
}
