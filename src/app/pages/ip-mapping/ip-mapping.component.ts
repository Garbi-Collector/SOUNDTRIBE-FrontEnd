import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { AuthService } from "../../services/auth.service";
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

// Importa Leaflet correctamente
import * as L from 'leaflet';

// Configuración de iconos por defecto de Leaflet
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconUrl: 'assets/leaflet/marker-icon.png',
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

interface IPData {
  ip: string;
  requests: number;
}

interface DashboardStats {
  total_requests: number;
  unique_ips: number;
  top_ips: IPData[];
}

interface IPLocation {
  lat: number;
  lon: number;
  city: string;
  country: string;
  isp: string;
}

interface RequestData {
  ip: string;
  time: string;
}

@Component({
  selector: 'app-ip-mapping',
  templateUrl: './ip-mapping.component.html',
  styleUrls: ['./ip-mapping.component.css']
})
export class IpMappingComponent implements OnInit, OnDestroy, AfterViewInit {

  isUserAdmin: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  showError: boolean = false;
  showDetailsView: boolean = false;

  // Dashboard data
  totalRequests: number = 0;
  uniqueIps: number = 0;
  avgRequests: number = 0;
  topIps: IPData[] = [];
  currentData: DashboardStats | null = null;

  // Map related
  map: L.Map | null = null;
  markers: L.Marker[] = [];

  // IP Details
  selectedIP: string = '';
  ipTimeline: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.isUserAdmin = this.authService.isAdmin();

    if (this.isUserAdmin) {
      this.loadDashboardData();
    }
  }

  ngAfterViewInit(): void {
    if (this.isUserAdmin) {
      setTimeout(() => {
        this.initializeMap();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.map) {
      this.clearMarkers();
      this.map.remove();
      this.map = null;
    }
  }

  // Initialize Leaflet map
  initializeMap(): void {
    if (this.map) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.warn('Map element not found');
      return;
    }

    try {
      this.map = L.map('map').setView([0, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  // Load dashboard data from API
  async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    this.hideError();

    try {
      let response;
      try {
        response = await fetch('http://soundtribe.art:5000/stats');
      } catch (corsError) {
        console.log('Direct connection failed, trying with CORS proxy...');
        response = await fetch('https://cors-anywhere.herokuapp.com/http://soundtribe.art:5000/stats');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DashboardStats = await response.json();
      this.currentData = data;

      this.updateStats(data);
      await this.loadIPLocations(data.top_ips);
      this.topIps = data.top_ips;

      this.isLoading = false;

    } catch (error) {
      console.error('Error loading data:', error);
      this.isLoading = false;
      this.showErrorMessage('Error CORS: Para desarrollo local, considera usar un servidor web local o configurar CORS en el backend. También puedes usar la extensión "CORS Unblock" en tu navegador.');
    }
  }

  // Update statistics
  updateStats(data: DashboardStats): void {
    this.totalRequests = data.total_requests;
    this.uniqueIps = data.unique_ips;
    this.avgRequests = Math.round(data.total_requests / data.unique_ips);
  }

  // Load IP locations and add markers
  async loadIPLocations(topIps: IPData[]): Promise<void> {
    if (!this.map) {
      console.warn('Map not initialized, cannot add markers');
      return;
    }

    this.clearMarkers();

    for (const ipData of topIps) {
      try {
        const location = await this.getIPLocation(ipData.ip);
        if (location && location.lat && location.lon) {
          this.addMarkerToMap(location, ipData);
        }
      } catch (error) {
        console.warn(`Could not get location for IP ${ipData.ip}:`, error);
      }

      // Small delay to avoid overwhelming the geolocation service
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Get IP location using geolocation service
  async getIPLocation(ip: string): Promise<IPLocation | null> {
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          lat: data.lat,
          lon: data.lon,
          city: data.city,
          country: data.country,
          isp: data.isp
        };
      }
      return null;
    } catch (error) {
      console.warn('Error getting IP location:', error);
      return null;
    }
  }

  // Add marker to map
  addMarkerToMap(location: IPLocation, ipData: IPData): void {
    if (!this.map) {
      console.warn('Map not initialized, cannot add marker');
      return;
    }

    try {
      const marker = L.marker([location.lat, location.lon])
        .addTo(this.map)
        .bindTooltip(`
          <strong>IP:</strong> ${ipData.ip}<br>
          <strong>Requests:</strong> ${ipData.requests}<br>
          <strong>Ciudad:</strong> ${location.city}<br>
          <strong>País:</strong> ${location.country}
        `, {
          permanent: false,
          direction: 'top'
        });

      marker.on('click', () => {
        this.showIPDetails(ipData.ip);
      });

      this.markers.push(marker);
    } catch (error) {
      console.error('Error adding marker to map:', error);
    }
  }

  // Clear all markers
  clearMarkers(): void {
    if (this.map) {
      this.markers.forEach(marker => {
        this.map!.removeLayer(marker);
      });
    }
    this.markers = [];
  }

  // Show IP details
  async showIPDetails(ip: string): Promise<void> {
    this.selectedIP = ip;
    this.showDetailsView = true;

    try {
      let response;
      try {
        response = await fetch('http://soundtribe.art:5000/getall');
      } catch (corsError) {
        console.log('Direct connection failed, trying with CORS proxy...');
        response = await fetch('https://cors-anywhere.herokuapp.com/http://soundtribe.art:5000/getall');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allData: RequestData[] = await response.json();
      const ipRequests = allData.filter(item => item.ip === ip);

      this.displayIPTimeline(ipRequests);

    } catch (error) {
      console.error('Error loading IP details:', error);
      this.ipTimeline = [];
    }
  }

  // Display IP timeline
  displayIPTimeline(requests: RequestData[]): void {
    if (requests.length === 0) {
      this.ipTimeline = [];
      return;
    }

    // Group requests by hour
    const groupedRequests = this.groupRequestsByHour(requests);

    this.ipTimeline = Object.keys(groupedRequests)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 50) // Show only last 50 groups
      .map(hour => ({
        time: hour,
        count: groupedRequests[hour],
        formattedTime: new Date(hour).toLocaleString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
  }

  // Group requests by hour
  groupRequestsByHour(requests: RequestData[]): { [key: string]: number } {
    const grouped: { [key: string]: number } = {};

    requests.forEach(request => {
      const date = new Date(request.time);
      const hourKey = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString();

      if (!grouped[hourKey]) {
        grouped[hourKey] = 0;
      }
      grouped[hourKey]++;
    });

    return grouped;
  }

  // UI Methods
  backToDashboard(): void {
    this.showDetailsView = false;
    this.selectedIP = '';
    this.ipTimeline = [];
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
  }

  hideError(): void {
    this.showError = false;
    this.errorMessage = '';
  }

  // Utility methods for template
  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  onIPCardClick(ip: string): void {
    this.showIPDetails(ip);
  }
}
