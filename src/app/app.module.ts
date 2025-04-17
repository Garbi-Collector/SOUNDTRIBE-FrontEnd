import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Componentes
import { AppComponent } from './app.component';
import { BibliotecaComponent } from './pages/biblioteca/biblioteca.component';
import { ExplorarComponent } from './pages/explorar/explorar.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { AuthComponent } from './pages/auth/auth.component';

// Servicios
import { ThemeService } from './services/theme.service';

// Layout Components
import { HeaderComponent } from "./layouts/header/header.component";
import { FooterComponent } from "./layouts/footer/footer.component";
import { AuthInicioComponent } from "./pages/models/auth-inicio/auth-inicio.component";
import { AuthCrearComponent } from "./pages/models/auth-crear/auth-crear.component";
import { AuthInterceptor } from "./AuthInterceptor";
import { NotfoundComponent } from './pages/not-found/notfound.component';


// Definir las rutas
const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'explorar', component: ExplorarComponent },
  { path: 'biblioteca', component: BibliotecaComponent },
  {
    path: 'auth',
    component: AuthComponent,
    children: [
      { path: '', redirectTo: 'iniciar', pathMatch: 'full' },
      { path: 'iniciar', component: AuthInicioComponent },
      { path: 'crear', component: AuthCrearComponent }
    ]
  },
  { path: 'not-found', component: NotfoundComponent },
  { path: '**', redirectTo: 'not-found' }
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
    NotfoundComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forRoot(routes),
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
