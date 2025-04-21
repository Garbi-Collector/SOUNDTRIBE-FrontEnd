import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

// Componentes principales
import { AppComponent } from './app.component';
import { BibliotecaComponent } from './pages/biblioteca/biblioteca.component';
import { ExplorarComponent } from './pages/explorar/explorar.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

// Componentes de interfaz
import { HeaderComponent } from './layouts/header/header.component';
import { FooterComponent } from './layouts/footer/footer.component';
import { AuthModalComponent } from './modales/auth-modal/auth-modal.component';
import {AppRoutingModule} from "./AppRoutingModule";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";
import { PerfilComponent } from './pages/perfil/perfil.component';

// Módulos

@NgModule({
  declarations: [
    AppComponent,
    BibliotecaComponent,
    ExplorarComponent,
    InicioComponent,
    NotFoundComponent,
    HeaderComponent,  // Asegúrate de que esté declarado aquí
    FooterComponent,  // Asegúrate de que esté declarado aquí
    AuthModalComponent, PerfilComponent // Asegúrate de que esté declarado aquí
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
