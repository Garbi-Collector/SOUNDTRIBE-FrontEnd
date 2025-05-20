import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

interface Platform {
  x: number;
  y: number;
  width: number;
  hasEnemy: boolean;
  enemyType?: 'ghost' | 'pigeon';
  enemyDirection?: 'left' | 'right';
  enemyPosition?: number;
  cooldown?: number;
  isFalling: boolean;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-game',
  template: `
    <div class="game-container" [style.width.px]="canvasWidth" [style.height.px]="canvasHeight">
      <div class="player" [style.left.px]="player.x" [style.bottom.px]="player.y" [style.width.px]="player.width" [style.height.px]="player.height"></div>
      <div *ngFor="let platform of platforms" class="platform"
           [style.left.px]="platform.x"
           [style.bottom.px]="platform.y"
           [style.width.px]="platform.width"
           [ngClass]="{'falling': platform.isFalling}">
        <div *ngIf="platform.hasEnemy" class="enemy"
             [ngClass]="platform.enemyType"
             [style.left.px]="platform.enemyPosition"
             [style.transform]="platform.enemyDirection === 'left' ? 'scaleX(1)' : 'scaleX(-1)'">
        </div>
      </div>
      <div class="lava" [style.height.px]="lavaHeight" [style.bottom.px]="0"></div>
      <div class="score">Score: {{ score }}</div>
      <div class="record">Record: {{ record }}</div>
      <div *ngIf="gameOver" class="game-over">
        <h1>Game Over</h1>
        <p>Your Score: {{ score }}</p>
        <p>Record: {{ record }}</p>
        <button (click)="restartGame()">Restart</button>
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      position: relative;
      background-color: #111;
      overflow: hidden;
    }
    .player {
      position: absolute;
      background-color: orange;
      border-radius: 5px;
    }
    .platform {
      position: absolute;
      background-color: green;
      border: 2px solid lime;
      transition: background-color 0.3s ease-in-out;
    }
    .platform.falling {
      background-color: red;
    }
    .lava {
      position: absolute;
      background-color: red;
      width: 100%;
    }
    .score, .record {
      position: absolute;
      top: 10px;
      left: 10px;
      color: white;
      font-size: 1.2em;
      z-index: 10;
    }
    .record {
      top: 30px;
    }
    .game-over {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 5px;
      text-align: center;
      z-index: 100;
    }
    .game-over button {
      padding: 10px 20px;
      font-size: 1em;
      cursor: pointer;
    }
    .enemy {
      position: absolute;
      bottom: 100%; /* Position above the platform */
      height: 20px;
      width: 20px;
      border-radius: 50%;
    }
    .ghost {
      background-color: purple;
    }
    .pigeon {
      background-color: lightblue;
    }
  `]
})
export class GameComponent implements OnInit, OnDestroy {
  canvasWidth = 600;
  canvasHeight = 400;
  player: Player = { x: this.canvasWidth / 2 - 15, y: 50, width: 30, height: 30 };
  platforms: Platform[] = [];
  gravity = 1;
  jumpStrength = 20;
  isJumping = false;
  velocityY = 0;
  platformSpeed = 2;
  platformCooldownTime = 2000; // milliseconds
  lavaHeight = 0;
  lavaSpeed = 0.5;
  score = 0;
  record = 0;
  gameOver = false;
  private gameLoopSubscription: Subscription | undefined;
  private lavaLoopSubscription: Subscription | undefined;
  private enemyMoveInterval = 15; // milliseconds
  private platformCooldowns: { [key: number]: Subscription } = {};

  ngOnInit(): void {
    this.loadRecord();
    this.startGame();
  }

  ngOnDestroy(): void {
    if (this.gameLoopSubscription) {
      this.gameLoopSubscription.unsubscribe();
    }
    if (this.lavaLoopSubscription) {
      this.lavaLoopSubscription.unsubscribe();
    }
    Object.values(this.platformCooldowns).forEach(sub => sub.unsubscribe());
  }

  startGame(): void {
    this.player = { x: this.canvasWidth / 2 - 15, y: 50, width: 30, height: 30 };
    this.platforms = this.initializePlatforms();
    this.lavaHeight = 0;
    this.score = 0;
    this.gameOver = false;
    this.startGameLoops();
  }

  restartGame(): void {
    this.startGame();
  }

  loadRecord(): void {
    const storedRecord = localStorage.getItem('gameRecord');
    this.record = storedRecord ? parseInt(storedRecord, 10) : 0;
  }

  saveRecord(): void {
    localStorage.setItem('gameRecord', this.record.toString());
  }

  initializePlatforms(): Platform[] {
    const initialPlatforms: Platform[] = [];
    initialPlatforms.push(<Platform>{x: this.player.x - 10, y: this.player.y - 5, width: 60, isFalling: false});
    let currentY = this.player.y + 100;
    while (currentY < this.canvasHeight) {
      const width = Math.random() * 50 + 50;
      const x = Math.random() * (this.canvasWidth - width - 20) + 10;
      const hasEnemy = Math.random() < 0.3;
      let enemyType: 'ghost' | 'pigeon' | undefined;
      let enemyDirection: 'left' | 'right' | undefined;
      let enemyPosition: number | undefined;
      if (hasEnemy) {
        enemyType = Math.random() < 0.5 ? 'ghost' : 'pigeon';
        enemyDirection = Math.random() < 0.5 ? 'left' : 'right';
        enemyPosition = enemyDirection === 'left' ? 0 : width - 20;
      }
      initialPlatforms.push({ x, y: currentY, width, hasEnemy, enemyType, enemyDirection, enemyPosition, isFalling: false });
      currentY += Math.random() * 80 + 50;
    }
    return initialPlatforms;
  }

  startGameLoops(): void {
    this.gameLoopSubscription = interval(15).subscribe(() => {
      this.updatePlayer();
      this.updatePlatforms();
      this.checkCollisions();
      this.updateEnemies();
    });
    this.lavaLoopSubscription = interval(100).subscribe(() => {
      if (!this.gameOver) {
        this.lavaHeight += this.lavaSpeed;
        if (this.player.y < this.lavaHeight) {
          this.endGame();
        }
      }
    });
  }

  updatePlayer(): void {
    if (this.isJumping) {
      this.player.y += this.velocityY;
      this.velocityY -= this.gravity;
      if (this.velocityY < 0) {
        this.isJumping = false;
      }
    }
  }

  updatePlatforms(): void {
    this.platforms.forEach(platform => {
      if (platform.enemyType && platform.enemyPosition !== undefined && platform.enemyDirection) {
        if (platform.enemyDirection === 'left') {
          platform.enemyPosition += 0.5;
          if (platform.enemyPosition > platform.width - 20) {
            platform.enemyDirection = 'right';
          }
        } else {
          platform.enemyPosition -= 0.5;
          if (platform.enemyPosition < 0) {
            platform.enemyDirection = 'left';
          }
        }
      }
    });
    this.platforms = this.platforms.filter(platform => platform.y > -50);
    const highestPlatformY = this.platforms.reduce((max, p) => Math.max(max, p.y), 0);
    if (highestPlatformY < this.player.y + 300) {
      this.addPlatform();
    }
  }

  addPlatform(): void {
    const lastPlatformY = this.platforms.reduce((max, p) => Math.max(max, p.y), 0);
    const width = Math.random() * 50 + 50;
    const y = lastPlatformY + Math.random() * 80 + 50;
    const x = Math.random() * (this.canvasWidth - width - 20) + 10;
    const hasEnemy = Math.random() < 0.3;
    let enemyType: 'ghost' | 'pigeon' | undefined;
    let enemyDirection: 'left' | 'right' | undefined;
    let enemyPosition: number | undefined;
    if (hasEnemy) {
      enemyType = Math.random() < 0.5 ? 'ghost' : 'pigeon';
      enemyDirection = Math.random() < 0.5 ? 'left' : 'right';
      enemyPosition = enemyDirection === 'left' ? 0 : width - 20;
    }
    this.platforms.push({ x, y, width, hasEnemy, enemyType, enemyDirection, enemyPosition, isFalling: false });
  }

  checkCollisions(): void {
    if (this.player.y <= 0 && !this.gameOver) {
      this.endGame();
      return;
    }

    this.platforms.forEach(platform => {
      if (
        this.player.x < platform.x + platform.width &&
        this.player.x + this.player.width > platform.x &&
        this.player.y < platform.y + 35 && // Slightly larger than player height for landing
        this.player.y + this.player.height > platform.y &&
        this.velocityY <= 0 // Only check when falling or standing
      ) {
        if (this.isJumping) {
          this.isJumping = false;
          this.velocityY = 0;
          this.player.y = platform.y + 30; // Adjust player position to be on the platform
          this.startPlatformCooldown(platform);
          this.score += platform.hasEnemy ? 10 : 5;
        } else if (!this.gameOver && this.player.y + this.player.height > platform.y) {
          this.player.y = platform.y + 30; // Keep player on the platform if not jumping
        }
      }
    });
  }

  updateEnemies(): void {
    this.platforms.forEach(platform => {
      if (platform.hasEnemy && platform.enemyType && platform.enemyPosition !== undefined) {
        const enemyLeft = platform.x + platform.enemyPosition;
        const enemyRight = enemyLeft + 20; // Enemy width is 20px

        if (
          this.player.x < enemyRight &&
          this.player.x + this.player.width > enemyLeft &&
          this.player.y < platform.y + 20 + this.player.height && // Check collision with enemy height
          this.player.y + this.player.height > platform.y
        ) {
          this.endGame();
        }
      }
      if (platform.isFalling && this.player.x < platform.x + platform.width &&
        this.player.x + this.player.width > platform.x &&
        this.player.y < platform.y + this.player.height &&
        this.player.y + this.player.height > platform.y) {
        this.endGame();
      }
    });
  }

  startPlatformCooldown(platform: Platform): void {
    const platformIndex = this.platforms.indexOf(platform);
    if (platformIndex !== -1 && !this.platformCooldowns[platformIndex]) {
      this.platformCooldowns[platformIndex] = interval(this.platformCooldownTime).subscribe(() => {
        const index = this.platforms.findIndex(p => p === platform);
        if (index !== -1) {
          this.platforms[index].isFalling = true;
          setTimeout(() => {
            this.platforms = this.platforms.filter((_, i) => i !== index);
          }, 1000); // Platform falls for 1 second
        }
        if (this.platformCooldowns[platformIndex]) {
          this.platformCooldowns[platformIndex].unsubscribe();
          delete this.platformCooldowns[platformIndex];
        }
      });
    }
  }

  endGame(): void {
    this.gameOver = true;
    if (this.score > this.record) {
      this.record = this.score;
      this.saveRecord();
    }
    if (this.gameLoopSubscription) {
      this.gameLoopSubscription.unsubscribe();
    }
    if (this.lavaLoopSubscription) {
      this.lavaLoopSubscription.unsubscribe();
    }
    Object.values(this.platformCooldowns).forEach(sub => sub.unsubscribe());
    this.platformCooldowns = {};
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.gameOver && !this.isJumping) {
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        this.jump(-1); // Jump left
      } else if (event.key === 'ArrowRight' || event.key === 'd') {
        this.jump(1); // Jump right
      } else if (event.key === 'w' || event.key === 'ArrowUp') {
        this.jump(0); // Vertical jump (if needed or for initial jump)
      }
    } else if (this.gameOver && event.key === 'r') {
      this.restartGame();
    }
  }

  jump(direction: number): void {
    this.isJumping = true;
    this.velocityY = this.jumpStrength;
    if (direction === -1) {
      this.player.x -= 20; // Move left during jump
    } else if (direction === 1) {
      this.player.x += 20; // Move right during jump
    }
  }
}
