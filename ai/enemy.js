import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

class Enemy {
    constructor(spawnPosition, world) {
        this.world = world;
        this.position = new THREE.Vector3(spawnPosition.x, spawnPosition.y, spawnPosition.z);
        this.rotation = 0;
        this.velocity = new THREE.Vector3();
        
        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.isDead = false;
        this.speed = 5;
        this.detectionRange = 30;
        this.attackRange = 20;
        this.lastShotTime = 0;
        this.fireRate = 800;
        this.damage = 15;
        
        // AI state
        this.state = 'patrol'; // patrol, chase, attack
        this.patrolTarget = this.getRandomPoint();
        this.targetPlayer = null;
        this.shootCooldown = 0;
        
        this.createMesh();
    }
    
    createMesh() {
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xff3333 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        
        // Gun
        const gunGeo = new THREE.BoxGeometry(0.2, 0.2, 0.8);
        const gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        this.gun = new THREE.Mesh(gunGeo, gunMat);
        this.gun.position.set(0.5, 0.5, 0.5);
        this.mesh.add(this.gun);
    }
    
    update(deltaTime, player, bulletManager) {
        if (this.isDead) return;
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // State machine
        const distToPlayer = this.position.distanceTo(player.position);
        
        if (distToPlayer < this.detectionRange && !player.isDead) {
            if (distToPlayer < this.attackRange) {
                this.state = 'attack';
            } else {
                this.state = 'chase';
            }
            this.targetPlayer = player;
        } else {
            this.state = 'patrol';
            this.targetPlayer = null;
        }
        
        // Execute state
        switch(this.state) {
            case 'patrol':
                this.patrol(deltaTime);
                break;
            case 'chase':
                this.chase(deltaTime, player);
                break;
            case 'attack':
                this.attack(deltaTime, player, bulletManager);
                break;
        }
        
        // Keep on ground
        const groundHeight = this.world.getGroundHeight(this.position.x, this.position.z);
        if (this.position.y > groundHeight + 1) {
            this.position.y = groundHeight + 1;
        }
    }
    
    patrol(deltaTime) {
        const dist = this.position.distanceTo(this.patrolTarget);
        
        if (dist < 2) {
            this.patrolTarget = this.getRandomPoint();
        }
        
        this.moveTo(this.patrolTarget, deltaTime);
    }
    
    chase(deltaTime, player) {
        this.moveTo(player.position, deltaTime);
    }
    
    attack(deltaTime, player, bulletManager) {
        // Look at player
        const direction = player.position.clone().sub(this.position).normalize();
        this.rotation = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = this.rotation;
        
        // Shoot
        const now = performance.now();
        if (now - this.lastShotTime > this.fireRate) {
            this.lastShotTime = now;
            
            // Add some inaccuracy
            const spread = 0.1;
            direction.x += (Math.random() - 0.5) * spread;
            direction.z += (Math.random() - 0.5) * spread;
            direction.normalize();
            
            const origin = this.position.clone();
            origin.y += 1.5;
            
            bulletManager.fire(origin, direction, this.damage, 80, 'enemy');
        }
    }
    
    moveTo(target, deltaTime) {
        const direction = target.clone().sub(this.position);
        direction.y = 0;
        const dist = direction.length();
        
        if (dist > 0.5) {
            direction.normalize();
            this.position.add(direction.multiplyScalar(this.speed * deltaTime));
            this.rotation = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.y = this.rotation;
        }
    }
    
    getRandomPoint() {
        const range = 50;
        return new THREE.Vector3(
            this.position.x + (Math.random() - 0.5) * range,
            0,
            this.position.z + (Math.random() - 0.5) * range
        );
    }
    
    takeDamage(amount, source) {
        if (this.isDead) return;
        
        this.health -= amount;
        
        // Flash red
        this.mesh.material.emissive.setHex(0xff0000);
        setTimeout(() => {
            if (this.mesh) this.mesh.material.emissive.setHex(0x000000);
        }, 100);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.isDead = true;
        this.mesh.visible = false;
    }
    
    respawn(position) {
        this.health = this.maxHealth;
        this.isDead = false;
        this.mesh.visible = true;
        this.position.copy(position);
        this.state = 'patrol';
    }
}

export class EnemyManager {
    constructor(world, player, count) {
        this.world = world;
        this.player = player;
        this.enemies = [];
        this.initialCount = count;
        
        this.spawnEnemies();
    }
    
    spawnEnemies() {
        for (let i = 0; i < this.initialCount; i++) {
            const spawn = this.world.getRandomSpawnPoint();
            // Ensure not too close to player
            const dist = Math.sqrt(
                Math.pow(spawn.x - this.player.position.x, 2) + 
                Math.pow(spawn.z - this.player.position.z, 2)
            );
            
            if (dist > 30) {
                const enemy = new Enemy(spawn, this.world);
                this.enemies.push(enemy);
            } else {
                i--; // Try again
            }
        }
    }
    
    update(deltaTime, bulletManager, safeZone) {
        for (const enemy of this.enemies) {
            enemy.update(deltaTime, this.player, bulletManager);
            
            // Safe zone damage
            if (!enemy.isDead) {
                const dist = enemy.position.distanceTo(safeZone.currentCenter);
                if (dist > safeZone.currentRadius) {
                    enemy.takeDamage(10 * deltaTime, 'storm');
                }
            }
        }
    }
    
    getEnemies() {
        return this.enemies;
    }
    
    getAliveCount() {
        return this.enemies.filter(e => !e.isDead).length;
    }
    
    cleanup() {
        for (const enemy of this.enemies) {
            this.world.scene.remove(enemy.mesh);
        }
    }
}
