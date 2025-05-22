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
import { ChangePasswordComponent } from './modales/change-password/change-password.component';
import { ChangeSlugComponent } from './modales/change-slug/change-slug.component';
import { SubirMusicaComponent } from './pages/subir-musica/subir-musica.component';
import { VerificarCuentaComponent } from './pages/verificar-cuenta/verificar-cuenta.component';
import {MatIconModule} from "@angular/material/icon";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatStepperModule} from "@angular/material/stepper";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatButtonModule} from "@angular/material/button";
import { AlbumComponent } from './pages/album/album.component';
import { MiniPlayerComponent } from './layouts/mini-player/mini-player.component';
import { NotificationModalComponent } from './modales/notification-modal/notification-modal.component';
import { DonationComponent } from './pages/donation/donation.component';
import { TerminosDonacionComponent } from './modales/terminos-donacion/terminos-donacion.component';
import { DonationSuccessComponent } from './pages/donation-success/donation-success.component';
import { GameComponent } from './pages/game/game.component';
import { TerminosCondicionesAppComponent } from './modales/terminos-condiciones-app/terminos-condiciones-app.component';
import { DocumentacionComponent } from './pages/documentacion/documentacion.component';
import { EliminarCuentaComponent } from './pages/eliminar-cuenta/eliminar-cuenta.component';
import { ChangeDescriptionComponent } from './modales/change-description/change-description.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';






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
    AuthModalComponent,
    PerfilComponent,
    ChangePasswordComponent,
    ChangeSlugComponent,
    SubirMusicaComponent,
    VerificarCuentaComponent,
    AlbumComponent,
    MiniPlayerComponent,
    NotificationModalComponent,
    DonationComponent,
    TerminosDonacionComponent,
    DonationSuccessComponent,
    GameComponent,
    TerminosCondicionesAppComponent,
    DocumentacionComponent,
    EliminarCuentaComponent,
    ChangeDescriptionComponent,
    DashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatButtonModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
