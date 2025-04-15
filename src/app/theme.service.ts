import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private theme = new BehaviorSubject<'light' | 'dark'>('dark');
  public theme$ = this.theme.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);

    // Comprobar si hay un tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.setTheme(savedTheme as 'light' | 'dark');
    } else {
      // Verificar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  setTheme(newTheme: 'light' | 'dark') {
    // Guardar preferencia en localStorage
    localStorage.setItem('theme', newTheme);

    // Eliminar la clase anterior y añadir la nueva
    if (newTheme === 'light') {
      this.renderer.removeClass(document.body, 'dark-theme');
      this.renderer.addClass(document.body, 'light-theme');
    } else {
      this.renderer.removeClass(document.body, 'light-theme');
      this.renderer.addClass(document.body, 'dark-theme');
    }

    this.theme.next(newTheme);
  }

  toggleTheme() {
    const currentTheme = this.theme.getValue();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  getCurrentTheme() {
    return this.theme.getValue();
  }
}
