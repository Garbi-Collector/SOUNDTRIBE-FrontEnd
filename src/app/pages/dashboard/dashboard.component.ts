import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, forkJoin } from 'rxjs';
import {
  DashboardSong,
  DashboardGeneroTopGlobal,
  DashboardEstiloTopGlobal,
  DashboardSubGeneroTopGlobal } from 'src/app/dtos/dashboard/dashboard.dto';
import {DashboardService} from "../../services/dashboard.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estados de carga
  loading = true;
  hasSongs = false;

  // KPIs personales
  playCount = 0;
  topSongs: DashboardSong[] = [];
  generosMasEscuchados: DashboardGeneroTopGlobal[] = [];

  // Datos globales
  generoTopGlobal: DashboardGeneroTopGlobal | null = null;
  subGeneroTopGlobal: DashboardSubGeneroTopGlobal | null = null;
  estiloTopGlobal: DashboardEstiloTopGlobal | null = null;

  // Configuración de gráficos
  barChartData: any[] = [];
  pieChartData: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData() {
    this.loading = true;

    // Primero verificamos si el usuario tiene canciones
    this.dashboardService.haveSongs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hasSongs) => {
          this.hasSongs = hasSongs;

          if (hasSongs) {
            this.loadPersonalStats();
          }

          // Siempre cargamos las estadísticas globales
          this.loadGlobalStats();
        },
        error: (error) => {
          console.error('Error verificando canciones:', error);
          this.loading = false;
        }
      });
  }

  private loadPersonalStats() {
    const personalStats$ = forkJoin({
      playCount: this.dashboardService.getPlayCount(),
      topSongs: this.dashboardService.getTopSongs(),
      generosMasEscuchados: this.dashboardService.getGeneroMasEscuchado()
    });

    personalStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.playCount = data.playCount;
          this.topSongs = data.topSongs.slice(0, 5); // Solo top 5
          this.generosMasEscuchados = data.generosMasEscuchados;

          this.prepareChartData();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error cargando estadísticas personales:', error);
          this.loading = false;
        }
      });
  }

  private loadGlobalStats() {
    const globalStats$ = forkJoin({
      generoTop: this.dashboardService.getGeneroTopGlobal(),
      subGeneroTop: this.dashboardService.getSubGeneroTopGlobal(),
      estiloTop: this.dashboardService.getEstiloTopGlobal()
    });

    globalStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.generoTopGlobal = data.generoTop;
          this.subGeneroTopGlobal = data.subGeneroTop;
          this.estiloTopGlobal = data.estiloTop;

          if (!this.hasSongs) {
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error cargando estadísticas globales:', error);
          if (!this.hasSongs) {
            this.loading = false;
          }
        }
      });
  }

  private prepareChartData() {
    // Preparar datos para gráfico de barras (Top canciones)
    this.barChartData = this.topSongs.map(song => ({
      name: song.nameSong,
      value: song.playCount
    }));

    // Preparar datos para gráfico de torta (Géneros)
    this.pieChartData = this.generosMasEscuchados.map(genero => ({
      name: genero.nameGenero,
      value: genero.percent
    }));
  }

  // Método para formatear números grandes
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getColor(index: number): string {
    const colors = [
      '#ff34d2', // rosa fuerte
      '#a64dff', // morado vibrante
      '#34b0ff', // azul brillante
      '#ff4500', // naranja rojizo
      '#8a2be2', // azul violeta
      '#ff1493', // rosa intenso
      '#00ced1', // turquesa
      '#ff7f50', // coral
    ];
    return colors[index % colors.length];
  }


  navigateToUpload() {
    this.router.navigate(['/subir-musica']);
  }
}
