import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserExperienceService, UserDescription } from '../../services/user-experience.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  userProfile: UserDescription | null = null;
  loading: boolean = true;
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserExperienceService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const userSlug = params.get('userhash');
      if (userSlug) {
        this.loadUserProfile(userSlug);
      } else {
        this.router.navigate(['/not-found']);
      }
    });
  }

  loadUserProfile(slug: string): void {
    this.loading = true;
    this.userService.getUserDescriptionBySlug(slug)
      .pipe(
        catchError(err => {
          console.error('Error cargando el perfil:', err);
          this.error = true;
          this.loading = false;
          return of(null);
        })
      )
      .subscribe(user => {
        this.userProfile = user;
        this.loading = false;
        if (!user) {
          this.router.navigate(['/not-found']);
        }
      });
  }

  followUser(): void {
    if (this.userProfile) {
      this.userService.followUser(this.userProfile.id)
        .subscribe({
          next: () => {
            // Actualizar el perfil tras seguir al usuario
            this.loadUserProfile(this.userProfile!.slug);
          },
          error: err => console.error('Error al seguir al usuario:', err)
        });
    }
  }
}
