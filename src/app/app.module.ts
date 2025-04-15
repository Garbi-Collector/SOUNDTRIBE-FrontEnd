import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

// Componentes
import { AppComponent } from './app.component';
import { BibliotecaComponent } from './pages/biblioteca/biblioteca.component';
import { ExplorarComponent } from './pages/explorar/explorar.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { AuthComponent } from './pages/auth/auth.component';

// Servicios
import { ThemeService } from './theme.service';

// Interceptor para añadir el token a las peticiones

// Layout Components
import { HeaderComponent } from "./layouts/header/header.component";
import { FooterComponent } from "./layouts/footer/footer.component";
import { AuthInicioComponent } from "./pages/models/auth-inicio/auth-inicio.component";
import { AuthCrearComponent } from "./pages/models/auth-crear/auth-crear.component";
import {AuthInterceptor} from "./AuthInterceptor";

// Definir las rutas
const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: InicioComponent },
      { path: 'explorar', component: ExplorarComponent },
      { path: 'biblioteca', component: BibliotecaComponent }
    ]
  },
  {
    path: 'auth',
    component: AuthComponent,
    children: [
      { path: '', redirectTo: 'iniciar', pathMatch: 'full' },
      { path: 'iniciar', component: AuthInicioComponent },
      { path: 'crear', component: AuthCrearComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    BibliotecaComponent,
    ExplorarComponent,
    InicioComponent,
    AuthComponent,
    HeaderComponent,
    FooterComponent,
    AuthInicioComponent,
    AuthCrearComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,  // Añadido HttpClientModule
    FormsModule,       // Añadido FormsModule
    ReactiveFormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    ThemeService,
    // Añadir el interceptor HTTP
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
