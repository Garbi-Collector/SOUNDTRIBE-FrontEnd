// auth.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  activeTab: 'login' | 'register' = 'login';

  constructor(
      private router: Router,
      private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Detectar la ruta actual para activar la pestaña correspondiente
    this.route.url.subscribe(segments => {
      const lastSegment = segments[segments.length - 1]?.path;
      this.route.children[0]?.url.subscribe(childSegments => {
        const childPath = childSegments[0]?.path;
        if (childPath === 'crear') {
          this.activeTab = 'register';
        } else {
          this.activeTab = 'login';
        }
      });
    });
  }

  setActiveTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;

    // Navegar a la ruta correspondiente
    const route = tab === 'login' ? '/auth/iniciar' : '/auth/crear';
    this.router.navigate([route]);
  }
}
