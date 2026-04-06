import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { Player } from '../player/player.js';
import { World } from '../world/map.js';
import { WeaponSystem } from '../weapons/gun.js';
import { BulletManager } from '../weapons/bullets.js';
import { EnemyManager } from '../ai/enemy.js';
import { SafeZone } from '../world/safeZone.js';
import { HUD } from '../ui/hud.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.isRunning = false;
        this.isPaused = false;
        this.gameState = 'menu'; // menu, playing, gameover
        
        // Core systems
        this.renderer = new Renderer(this.canvas);
        this.input = new InputHandler();
        this.world = new World();
        this.safeZone = new SafeZone();
        
        // Game objects
        this.player = null;
        this.enemies = null;
        this.bulletManager = null;
        this.weaponSystem = null;
        
        // Game data
        this.alivePlayers = 50;
        this.stormDamage = 10;
        this.matchTime = 0;
        
        // Bind loop
        this.gameLoop = this.gameLoop.bind(this);
        
        // Handle window resize
        window.addEventListener('resize', () => this.renderer.resize());
    }
    
    start() {
        // Hide menu, show HUD
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('game-over').classList.add('hidden');
        
        // Reset game state
        this.gameState = 'playing';
        this.isRunning = true;
        this.matchTime = 0;
        this.alivePlayers = 50;
        
        // Initialize game world
        this.initGame();
        
        // Lock pointer
        this.canvas.requestPointerLock();
        
        // Start loop
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }
    
    initGame() {
        // Create world
        this.world.generate();
        this.renderer.setScene(this.world.scene);
        
        // Create player at random spawn
        const spawnPoint = this.world.getRandomSpawnPoint();
        this.player = new Player(spawnPoint, this.input);
        this.renderer.setPlayer(this.player);
        
        // Weapon system
        this.weaponSystem = new WeaponSystem(this.player);
        this.bulletManager = new BulletManager(this.world);
        
        // Create enemies
        this.enemies = new EnemyManager(this.world, this.player, 8);
        
        // Initialize safe zone
        this.safeZone.init(this.world.mapSize);
        
        // Setup HUD
        this.hud = new HUD(this.player, this.weaponSystem, this);
        
        // Add entities to renderer
        this.renderer.addEntity(this.player.mesh);
        this.enemies.getEnemies().forEach(e => this.renderer.addEntity(e.mesh));
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing' && !this.isPaused) {
            this.update(deltaTime);
            this.render();
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        this.matchTime += deltaTime;
        
        // Update safe zone
        this.safeZone.update(deltaTime, this.matchTime);
        
        // Update player
        this.player.update(deltaTime, this.world);
        
        // Update camera
        this.renderer.updateCamera(deltaTime);
        
        // Update weapons
        this.weaponSystem.update(deltaTime);
        
        // Handle shooting
        if (this.input.isMouseDown(0) && !this.player.isDead) {
            const shot = this.weaponSystem.shoot();
            if (shot) {
                this.bulletManager.fire(
                    shot.origin,
                    shot.direction,
                    shot.damage,
                    shot.speed,
                    'player'
                );
            }
        }
        
        // Update bullets
        this.bulletManager.update(deltaTime, [this.player, ...this.enemies.getEnemies()]);
        
        // Update enemies
        this.enemies.update(deltaTime, this.bulletManager, this.safeZone);
        
        // Check safe zone damage
        this.checkSafeZoneDamage(deltaTime);
        
        // Check win/lose conditions
        this.checkGameEnd();
        
        // Update HUD
        this.hud.update(deltaTime);
    }
    
    checkSafeZoneDamage(deltaTime) {
        if (this.player.isDead) return;
        
        const dist = this.player.position.distanceTo(this.safeZone.currentCenter);
        if (dist > this.safeZone.currentRadius) {
            this.player.takeDamage(this.stormDamage * deltaTime, 'storm');
        }
    }
    
    checkGameEnd() {
        if (this.player.isDead) {
            this.endGame(false);
        } else if (this.enemies.getAliveCount() === 0) {
            this.endGame(true);
        }
    }
    
    endGame(victory) {
        this.gameState = 'gameover';
        document.exitPointerLock();
        
        const menu = document.getElementById('game-over');
        const title = document.getElementById('game-over-title');
        const stats = document.getElementById('game-over-stats');
        
        menu.classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        
        if (victory) {
            title.textContent = 'VICTORY ROYALE!';
            title.style.background = 'linear-gradient(90deg, #ffd700, #ffaa00)';
            title.style.webkitBackgroundClip = 'text';
            stats.textContent = `Kills: ${this.player.kills} | Survival Time: ${Math.floor(this.matchTime)}s`;
        } else {
            title.textContent = 'ELIMINATED';
            title.style.background = 'linear-gradient(90deg, #ff3333, #ff6666)';
            title.style.webkitBackgroundClip = 'text';
            stats.textContent = `Placement: #${this.alivePlayers} | Kills: ${this.player.kills}`;
        }
    }
    
    restart() {
        // Cleanup
        this.cleanup();
        
        // Start fresh
        this.start();
    }
    
    cleanup() {
        this.isRunning = false;
        this.bulletManager?.cleanup();
        this.enemies?.cleanup();
        this.renderer?.cleanup();
    }
    
    render() {
        this.renderer.render();
    }
    
    getAliveCount() {
        let count = this.player.isDead ? 0 : 1;
        count += this.enemies.getAliveCount();
        return count;
    }
}
