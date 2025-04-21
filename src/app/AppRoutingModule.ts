// AppRoutingModule.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio.component';
import { ExplorarComponent } from './pages/explorar/explorar.component';
import { BibliotecaComponent } from './pages/biblioteca/biblioteca.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioComponent },
  { path: 'explorar', component: ExplorarComponent },
  { path: 'biblioteca', component: BibliotecaComponent },
  { path: 'perfil/:slug', component: PerfilComponent },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
