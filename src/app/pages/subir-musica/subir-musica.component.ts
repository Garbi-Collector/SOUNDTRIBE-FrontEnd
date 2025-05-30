import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { AlbumService } from '../../services/album.service';
import { UserService } from '../../services/user.service';
import { CategoriaService } from '../../services/categoria.service';
import { ImageProcessingService } from '../../services/image-processing.service';
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
  isFinish = false;
  isLoading = false;
  isUploadingAlbum = false; // Nueva propiedad para distinguir carga de subida
  currentLoadingMessage = '';
  loadingMessageInterval: any;

  // Enumeración para tipos de álbum
  typeAlbumOptions = [
    { value: TypeAlbum.SINGLE, label: 'Single (1 canción)' },
    { value: TypeAlbum.EP, label: 'EP (3-6 canciones)' },
    { value: TypeAlbum.LP, label: 'LP (5-12 canciones)' }
  ];

  // Mensajes de carga divertidos
  loadingMessages = [
    'Cargando bits musicales...',
    'Dividiendo las canciones en notas...',
    'Aprendiendo a sumar frecuencias...',
    'Calibrando los sintetizadores...',
    'Mezclando ingredientes secretos...',
    'Dándole amor a cada beat...',
    'Empaquetando la magia musical...',
    'Conectando con las musas...',
    'Puliendo cada segundo de audio...',
    'Organizando el caos creativo...',
    'Preparando el escenario digital...',
    'Afinando los últimos detalles...',
    'Convirtiendo sueños en realidad...',
    'Despertando a los algoritmos...',
    'Tejiendo melodías en el espacio...',
    'Compilando vibraciones positivas...',
    'Sincronizando con el universo...',
    'Procesando ondas sonoras...',
    'Optimizando la experiencia auditiva...',
    'Creando momentos inolvidables...'
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
    private categoriaService: CategoriaService,
    private imageProcessingService: ImageProcessingService
  ) {
    this.albumForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.watchAlbumTypeChanges();
  }

  ngOnDestroy(): void {
    // Limpiar interval al destruir el componente
    if (this.loadingMessageInterval) {
      clearInterval(this.loadingMessageInterval);
    }
    this.stopLoadingMessages();

    if (this.confettiInterval) {
      clearInterval(this.confettiInterval);
    }

    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }
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
    this.categoriaService.getAllGeneros().subscribe({
      next: (generos) => {
        this.generos = generos;
        this.isLoading = false;

        // No precargar todos los subgéneros automáticamente
        // Los cargaremos bajo demanda cuando el usuario seleccione un género
      },
      error: (error) => {
        console.error('Error al cargar géneros:', error);
        this.isLoading = false;
      }
    });

    // Cargar estilos
    this.categoriaService.getAllEstilos().subscribe({
      next: (estilos) => {
        this.estilos = estilos;
      },
      error: (error) => {
        console.error('Error al cargar estilos:', error);
      }
    });

    // Cargar artistas amigos
    this.userService.getMutualArtistFriends().subscribe({
      next: (artists) => {
        this.mutualArtistFriends = artists;
      },
      error: (error) => {
        console.error('Error al cargar artistas amigos:', error);
      }
    });
  }






  // Nuevos métodos para manejar mensajes de carga

  private typewriterTimeout: any;
  private confettiInterval: any;


  startLoadingMessages(): void {
    this.currentLoadingMessage = '';
    this.typewriterEffect(this.getRandomLoadingMessage());

    this.loadingMessageInterval = setInterval(() => {
      this.typewriterEffect(this.getRandomLoadingMessage());
    }, 4000); // Cambiar mensaje cada 4 segundos para dar tiempo al efecto
  }


  // Efecto typewriter para los mensajes
  typewriterEffect(message: string): void {
    this.currentLoadingMessage = '';
    let i = 0;

    // Velocidad variable para efecto más natural
    const typeSpeed = () => Math.random() * 100 + 50; // Entre 50-150ms

    const typeChar = () => {
      if (i < message.length) {
        this.currentLoadingMessage += message.charAt(i);
        i++;
        this.typewriterTimeout = setTimeout(typeChar, typeSpeed());
      }
    };

    // Pequeña pausa antes de empezar a escribir
    setTimeout(typeChar, 300);
  }



  // Método mejorado para detener mensajes
  stopLoadingMessages(): void {
    if (this.loadingMessageInterval) {
      clearInterval(this.loadingMessageInterval);
      this.loadingMessageInterval = null;
    }

    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
      this.typewriterTimeout = null;
    }

    this.currentLoadingMessage = '';
  }


  // Método para crear confetis cuando termine la carga
  createConfetti(): void {
    const confettiContainer = document.querySelector('.confetti-container');
    if (!confettiContainer) return;

    // Limpiar confetis anteriores
    confettiContainer.innerHTML = '';

    // Crear confetis continuamente
    this.confettiInterval = setInterval(() => {
      this.generateConfetti(confettiContainer);
    }, 200);

    // Detener después de 8 segundos
    setTimeout(() => {
      if (this.confettiInterval) {
        clearInterval(this.confettiInterval);
        this.confettiInterval = null;
      }
    }, 8000);
  }

// Generar confetis individuales
  generateConfetti(container: Element): void {
    for (let i = 0; i < 5; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';

      // Posición aleatoria en X
      const randomX = Math.random() * 100;
      confetti.style.left = randomX + '%';

      // Duración aleatoria de caída
      const fallDuration = Math.random() * 2 + 3; // Entre 3-5 segundos
      confetti.style.animationDuration = fallDuration + 's';

      // Delay aleatorio
      const delay = Math.random() * 2;
      confetti.style.animationDelay = delay + 's';

      container.appendChild(confetti);

      // Remover el confeti después de la animación
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, (fallDuration + delay) * 1000);
    }
  }

  // Método para mostrar el mensaje final con confetis
  showFinishMessage(): void {
    this.isFinish = true;
    this.isUploadingAlbum = false;

    // Crear confetis después de un pequeño delay
    setTimeout(() => {
      this.createConfetti();
    }, 500);
  }

  getRandomLoadingMessage(): string {
    // Obtener artistas featured de todas las canciones
    const featuredArtists = this.getAllFeaturedArtists();

    // Mensajes base
    let messages = [...this.loadingMessages];

    // Agregar mensajes personalizados con artistas
    if (featuredArtists.length > 0) {
      featuredArtists.forEach(artist => {
        messages.push(`Maquillando a ${artist}...`);
        messages.push(`Preparando el micrófono para ${artist}...`);
        messages.push(`Dándole brillo a ${artist}...`);
        messages.push(`Ajustando la iluminación para ${artist}...`);
      });
    }

    // Agregar mensaje con el nombre del álbum si existe
    const albumName = this.albumForm.get('albumInfo.name')?.value;
    if (albumName) {
      messages.push(`Puliendo "${albumName}"...`);
      messages.push(`Dándole vida a "${albumName}"...`);
      messages.push(`Creando magia con "${albumName}"...`);
    }

    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }

  getAllFeaturedArtists(): string[] {
    const artists: string[] = [];
    this.songs.controls.forEach(songControl => {
      const artistIds = songControl.get('artistasFt')?.value || [];
      artistIds.forEach((artistId: any) => {
        const artistName = this.getArtistName(artistId);
        if (artistName && !artists.includes(artistName)) {
          artists.push(artistName);
        }
      });
    });
    return artists;
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

  async onPortadaSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar que sea una imagen (ahora aceptamos más formatos)
      if (!this.isValidImageFile(file)) {
        alert('El archivo debe ser una imagen válida y menor a 7MB');
        this.albumForm.get('albumInfo.portada')?.setValue(null);
        return;
      }

      try {
        this.isLoading = true;

        // Procesar la imagen: convertir a cuadrado y formato PNG
        let processedFile = await this.imageProcessingService.cropToSquare(file);

        // Si no era PNG originalmente, ya se convirtió en cropToSquare
        // Si quieres asegurar la conversión a PNG incluso si ya era cuadrado:
        if (file.type !== 'image/png') {
          processedFile = await this.imageProcessingService.convertToPng(processedFile);
        }

        // Actualizar el valor del formulario con el archivo procesado
        this.albumForm.get('albumInfo.portada')?.setValue(processedFile);

        // Crear preview con el archivo procesado
        const reader = new FileReader();
        reader.onload = () => {
          this.portadaPreview = reader.result as string;
          this.isLoading = false;
        };
        reader.readAsDataURL(processedFile);

      } catch (error) {
        console.error('Error al procesar la imagen:', error);
        alert('Error al procesar la imagen. Por favor, intenta con otro archivo.');
        this.albumForm.get('albumInfo.portada')?.setValue(null);
        this.isLoading = false;
      }
    }
  }


  onSongFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar formato y tamaño
      if (!this.isValidAudioFile(file)) {
        alert('El archivo debe ser formato .wav y menor a 60MB');
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
    const generoId = parseInt(event.target.value, 10); // Convertir a número para asegurar tipo correcto
    const subgenerosControl = this.songs.at(index).get('subgenero');

    // Resetear subgéneros seleccionados
    if (subgenerosControl) {
      subgenerosControl.setValue([]);
    }

    // Cargar los subgéneros si no están ya en el mapa
    if (!this.subgeneros.has(generoId)) {
      this.isLoading = true;
      this.categoriaService.getSubgenerosByGeneroId(generoId).subscribe({
        next: (subgeneros) => {
          this.subgeneros.set(generoId, subgeneros);
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error al cargar subgéneros para género ${generoId}:`, error);
          this.isLoading = false;
        }
      });
    }
  }

  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/bmp', 'image/gif'];
    const maxSize = 7 * 1024 * 1024; // 7MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  }


  isValidAudioFile(file: File): boolean {
    const validTypes = ['audio/wav', 'audio/x-wav'];
    const maxSize = 60 * 1024 * 1024; // 60MB
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

    // Iniciar carga especial para subida de álbum
    this.isUploadingAlbum = true;
    this.startLoadingMessages();

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
      .pipe(finalize(() => {
        this.isUploadingAlbum = false;
        this.stopLoadingMessages();
      }))
      .subscribe({
        next: (response) => {
          this.isFinish = true;
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

  // Mapa para rastrear la carga de subgéneros
  loadingSubgeneros: Map<number, boolean> = new Map();

  // Método para obtener subgéneros basados en el ID del género
  getSubgeneros(generoId: any): ResponseSubgeneroDto[] {
    if (!generoId) return [];

    // Convertir a número si es necesario
    const id = typeof generoId === 'string' ? parseInt(generoId, 10) : generoId;

    // Verificar si existe en el mapa
    if (!this.subgeneros.has(id)) {
      // Si no está en el mapa, cargar de la API si no está ya cargando
      if (!this.loadingSubgeneros.get(id)) {
        this.loadingSubgeneros.set(id, true);
        this.categoriaService.getSubgenerosByGeneroId(id).subscribe({
          next: (subgeneros) => {
            this.subgeneros.set(id, subgeneros);
            this.loadingSubgeneros.set(id, false);
          },
          error: (error) => {
            console.error(`Error al cargar subgéneros para género ${id}:`, error);
            this.loadingSubgeneros.set(id, false);
          }
        });
      }
      return []; // Mientras se carga, devolver array vacío
    }

    // Devolver los subgéneros del mapa
    return this.subgeneros.get(id) || [];
  }

  // Verificar si los subgéneros están cargando
  isLoadingSubgeneros(generoId: any): boolean {
    if (!generoId) return false;
    const id = typeof generoId === 'string' ? parseInt(generoId, 10) : generoId;
    return !!this.loadingSubgeneros.get(id);
  }
}
