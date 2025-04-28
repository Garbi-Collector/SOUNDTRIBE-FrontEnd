import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { AlbumService } from '../../services/album.service';
import { UserService } from '../../services/user.service';
import { CategoriaService } from '../../services/categoria.service';
import {
  RequestAlbumDto,
  RequestSongDto
} from '../../dtos/albumes/musics.request.dto';
import {
  ResponseGeneroDto,
  ResponseSubgeneroDto,
  ResponseEstiloDto,
  TypeAlbum
} from '../../dtos/albumes/musics.response.dto';
import { UserGet } from '../../dtos/usuarios/users.dto';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-subir-musica',
  templateUrl: './subir-musica.component.html',
  styleUrls: ['./subir-musica.component.css']
})
export class SubirMusicaComponent implements OnInit {
  // Formularios
  albumForm: FormGroup;
  currentStep = 0; // Para controlar el wizard de Bootstrap

  // Datos para selects
  generos: ResponseGeneroDto[] = [];
  subgeneros: Map<number, ResponseSubgeneroDto[]> = new Map();
  estilos: ResponseEstiloDto[] = [];
  mutualArtistFriends: UserGet[] = [];

  // Control de archivos
  portadaPreview: string | null = null;
  audioPreviews: Map<number, any> = new Map();

  // Estado de carga
  isLoading = false;

  // Enumeración para tipos de álbum
  typeAlbumOptions = [
    { value: TypeAlbum.SINGLE, label: 'Single (1 canción)' },
    { value: TypeAlbum.EP, label: 'EP (3-6 canciones)' },
    { value: TypeAlbum.LP, label: 'LP (5-12 canciones)' }
  ];

  get albumType() {
    return this.albumForm.get('albumInfo.typeAlbum')?.value;
  }

  get songs() {
    return this.albumForm.get('songs') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private albumService: AlbumService,
    private userService: UserService,
    private categoriaService: CategoriaService
  ) {
    this.albumForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.watchAlbumTypeChanges();
  }

  createForm(): FormGroup {
    return this.fb.group({
      albumInfo: this.fb.group({
        name: ['', Validators.required],
        description: [''],
        typeAlbum: ['', Validators.required],
        portada: [null, Validators.required]
      }),
      songs: this.fb.array([])
    });
  }

  createSongForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: [''],
      genero: [null, Validators.required],
      subgenero: [[]],
      estilo: [null, Validators.required],
      artistasFt: [[]],
      file: [null, Validators.required]
    });
  }

  loadInitialData(): void {
    this.isLoading = true;

    // Cargar géneros
    this.categoriaService.getAllGeneros().subscribe(generos => {
      this.generos = generos;

      // Precargar subgéneros para cada género
      generos.forEach(genero => {
        this.categoriaService.getSubgenerosByGeneroId(genero.id).subscribe(
          subgeneros => this.subgeneros.set(genero.id, subgeneros)
        );
      });
    });

    // Cargar estilos
    this.categoriaService.getAllEstilos().subscribe(estilos => {
      this.estilos = estilos;
    });

    // Cargar artistas amigos
    this.userService.getMutualArtistFriends().subscribe(artists => {
      this.mutualArtistFriends = artists;
      this.isLoading = false;
    });
  }

  watchAlbumTypeChanges(): void {
    const typeControl = this.albumForm.get('albumInfo.typeAlbum');

    typeControl?.valueChanges.subscribe(type => {
      const currentSongsCount = this.songs.length;

      if (type === TypeAlbum.SINGLE && currentSongsCount !== 1) {
        // Para SINGLE, ajustar a exactamente 1 canción
        this.clearSongs();
        this.addSong();
      } else if (type === TypeAlbum.EP && (currentSongsCount < 3 || currentSongsCount > 6)) {
        // Para EP, asegurar mínimo 3 canciones
        this.clearSongs();
        for (let i = 0; i < 3; i++) {
          this.addSong();
        }
      } else if (type === TypeAlbum.LP && (currentSongsCount < 5 || currentSongsCount > 12)) {
        // Para LP, asegurar mínimo 5 canciones
        this.clearSongs();
        for (let i = 0; i < 5; i++) {
          this.addSong();
        }
      }
    });
  }

  clearSongs(): void {
    while (this.songs.length > 0) {
      this.songs.removeAt(0);
    }
    this.audioPreviews = new Map();
  }

  addSong(): void {
    this.songs.push(this.createSongForm());
    // Opcional: Expandir el acordeón recién agregado
    setTimeout(() => {
      const newIndex = this.songs.length - 1;
      // Aquí podrías usar el API de Bootstrap manualmente para mostrar el acordeón
      // pero en este ejemplo estamos delegando eso al HTML con los atributos data-bs-*
    });
  }

  removeSong(index: number): void {
    // Verificar restricciones de cantidad según el tipo de álbum
    const minSongs = this.albumType === TypeAlbum.SINGLE ? 1 :
      this.albumType === TypeAlbum.EP ? 3 : 5;

    if (this.songs.length <= minSongs) {
      alert(`No se puede eliminar. Un ${this.albumType} requiere al menos ${minSongs} canciones.`);
      return;
    }

    // Eliminar la canción y su preview si existe
    if (this.audioPreviews.has(index)) {
      this.audioPreviews.delete(index);
    }
    this.songs.removeAt(index);
  }

  onPortadaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar tamaño y tipo de archivo
      if (!this.isValidImageFile(file)) {
        alert('La portada debe ser una imagen (JPG, PNG) y menor a 5MB');
        this.albumForm.get('albumInfo.portada')?.setValue(null);
        return;
      }

      // Actualizar el valor del formulario
      this.albumForm.get('albumInfo.portada')?.setValue(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        this.portadaPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSongFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar formato y tamaño
      if (!this.isValidAudioFile(file)) {
        alert('El archivo debe ser formato .wav y menor a 45MB');
        this.songs.at(index).get('file')?.setValue(null);
        return;
      }

      // Actualizar el valor del formulario
      this.songs.at(index).get('file')?.setValue(file);

      // Crear reproductor de audio para preview
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);

      // Guardar información del audio para la visualización
      this.audioPreviews.set(index, {
        audio: audio,
        url: audioUrl,
        duration: 0,
        currentTime: 0,
        isPlaying: false
      });

      // Obtener la duración cuando el audio esté cargado
      audio.onloadedmetadata = () => {
        const preview = this.audioPreviews.get(index);
        if (preview) {
          preview.duration = audio.duration;
          this.audioPreviews.set(index, preview);
        }
      };
    }
  }

  playPauseAudio(index: number): void {
    const preview = this.audioPreviews.get(index);
    if (!preview) return;

    if (preview.isPlaying) {
      preview.audio.pause();
      preview.isPlaying = false;
    } else {
      // Pausar cualquier otro audio que esté reproduciéndose
      this.audioPreviews.forEach((p, i) => {
        if (p.isPlaying && i !== index) {
          p.audio.pause();
          p.isPlaying = false;
          this.audioPreviews.set(i, p);
        }
      });

      preview.audio.play();
      preview.isPlaying = true;

      // Actualizar el tiempo actual durante la reproducción
      preview.audio.ontimeupdate = () => {
        const currentPreview = this.audioPreviews.get(index);
        if (currentPreview) {
          currentPreview.currentTime = preview.audio.currentTime;
          this.audioPreviews.set(index, currentPreview);
        }
      };
    }

    this.audioPreviews.set(index, preview);
  }

  onGeneroChange(event: any, index: number): void {
    const generoId = event.target.value; // Nota: cambiado de event.value a event.target.value para Bootstrap
    const subgenerosControl = this.songs.at(index).get('subgenero');

    // Resetear subgéneros seleccionados
    if (subgenerosControl) {
      subgenerosControl.setValue([]);
    }
  }

  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  isValidAudioFile(file: File): boolean {
    const validTypes = ['audio/wav', 'audio/x-wav'];
    const maxSize = 45 * 1024 * 1024; // 45MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  }

  // Nuevo método para manejar el cambio entre pasos
  changeStep(step: number): void {
    // Validar que se pueda avanzar o retroceder
    if (step > this.currentStep) {
      if (step === 1 && this.albumForm.get('albumInfo')?.invalid) {
        this.markFormGroupTouched(this.albumForm.get('albumInfo') as FormGroup);
        return;
      }
      if (step === 2 && this.songs.invalid) {
        this.markFormArrayTouched(this.songs);
        return;
      }
    }
    this.currentStep = step;
  }

  submitAlbum(): void {
    if (this.albumForm.invalid) {
      this.markFormGroupTouched(this.albumForm);
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Verificar restricciones de cantidad según el tipo de álbum
    const albumType = this.albumForm.get('albumInfo.typeAlbum')?.value;
    const songsCount = this.songs.length;

    if ((albumType === TypeAlbum.SINGLE && songsCount !== 1) ||
      (albumType === TypeAlbum.EP && (songsCount < 3 || songsCount > 6)) ||
      (albumType === TypeAlbum.LP && (songsCount < 5 || songsCount > 12))) {

      alert(`Un ${albumType} debe tener ${this.getAlbumSongsRequirement(albumType)}`);
      return;
    }

    this.isLoading = true;

    // Preparar datos para enviar
    const albumDto: RequestAlbumDto = {
      name: this.albumForm.get('albumInfo.name')?.value,
      description: this.albumForm.get('albumInfo.description')?.value,
      typeAlbum: this.albumForm.get('albumInfo.typeAlbum')?.value,
      portada: this.albumForm.get('albumInfo.portada')?.value,
      songs: this.songs.controls.map(song => ({
        name: song.get('name')?.value,
        description: song.get('description')?.value,
        genero: [song.get('genero')?.value], // Array con un solo elemento
        subgenero: song.get('subgenero')?.value || [],
        estilo: [song.get('estilo')?.value], // Array con un solo elemento
        artistasFt: song.get('artistasFt')?.value || [],
        file: song.get('file')?.value
      }))
    };

    // Enviar al servicio
    this.albumService.uploadAlbum(albumDto)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          alert('¡Álbum subido con éxito!');
          // Resetear formulario
          this.albumForm = this.createForm();
          this.portadaPreview = null;
          this.audioPreviews = new Map();
          this.currentStep = 0;
        },
        error: (error) => {
          console.error('Error al subir el álbum', error);
          alert('Error al subir el álbum. Intenta nuevamente.');
        }
      });
  }

  getAlbumSongsRequirement(type: string): string {
    switch(type) {
      case TypeAlbum.SINGLE: return 'exactamente 1 canción';
      case TypeAlbum.EP: return 'entre 3 y 6 canciones';
      case TypeAlbum.LP: return 'entre 5 y 12 canciones';
      default: return '';
    }
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);

      if (control instanceof FormControl) {
        control.markAsTouched();
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  markFormArrayTouched(formArray: FormArray) {
    formArray.controls.forEach((control) => {
      if (control instanceof FormControl) {
        control.markAsTouched();
      } else if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  canAddMoreSongs(): boolean {
    const type = this.albumForm.get('albumInfo.typeAlbum')?.value;
    if (!type) return false;

    if (type === TypeAlbum.SINGLE) return false;
    if (type === TypeAlbum.EP) return this.songs.length < 6;
    if (type === TypeAlbum.LP) return this.songs.length < 12;

    return false;
  }

  getArtistName(artistId: any): string {
    const artist = this.mutualArtistFriends.find(a => a.id === artistId);
    return artist?.username || '';
  }

  getFormattedDelimiter(isLast: boolean): string {
    return !isLast ? ', ' : '';
  }

  getAudioPreviewValue(index: number, property: string): any {
    const preview = this.audioPreviews.get(index);
    if (!preview) return null;
    return preview[property];
  }

  isAudioPlaying(index: number): boolean {
    return !!this.audioPreviews.get(index)?.isPlaying;
  }

  getAudioTime(index: number, property: string): number {
    return this.audioPreviews.get(index)?.[property] || 0;
  }

  getAudioProgressValue(index: number): number {
    const preview = this.audioPreviews.get(index);
    if (!preview || !preview.duration) return 0;
    return (preview.currentTime / preview.duration) * 100;
  }
}
