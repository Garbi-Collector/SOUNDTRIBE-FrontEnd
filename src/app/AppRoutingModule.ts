// AppRoutingModule.ts (actualizado con ruta de documentación)
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio.component';
import { ExplorarComponent } from './pages/explorar/explorar.component';
import { BibliotecaComponent } from './pages/biblioteca/biblioteca.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { SubirMusicaComponent } from './pages/subir-musica/subir-musica.component';
import { AlbumComponent } from './pages/album/album.component';
import { AuthGuard } from 'src/app/guards/AuthGuard';
import { RoleGuard } from 'src/app/guards/RoleGuard';
import { VerificarCuentaComponent } from "./pages/verificar-cuenta/verificar-cuenta.component";
import { DonationComponent } from "./pages/donation/donation.component";
import { DonationSuccessComponent } from "./pages/donation-success/donation-success.component";
import { GameComponent } from "./pages/game/game.component";
import { DocumentacionComponent } from "./pages/documentacion/documentacion.component"; // Importamos el componente de documentación

const routes: Routes = [
  { path: 'verificar-cuenta/:token', component: VerificarCuentaComponent },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'explorar', component: ExplorarComponent },
  { path: 'biblioteca', component: BibliotecaComponent },
  { path: 'perfil/:slug', component: PerfilComponent },
  { path: 'album/:albumSlug', component: AlbumComponent },
  { path: 'donation', component: DonationComponent },
  { path: 'donation/success', component: DonationSuccessComponent },
  { path: 'game-game-game', component: GameComponent },
  // Nueva ruta para la documentación
  { path: 'documentacion', component: DocumentacionComponent },
  {
    path: 'subir-musica',
    component: SubirMusicaComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      expectedRole: 'ARTISTA'
    }
  },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
