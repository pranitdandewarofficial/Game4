import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class BulletManager {
    constructor(world) {
        this.world = world;
        this.bullets = [];
        this.bulletPool = [];
        this.maxBullets = 100;
        this.bulletGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        this.bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        
        // Create pool
        for (let i = 0; i < this.maxBullets; i++) {
            const mesh = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial.clone());
            mesh.visible = false;
            this.world.scene.add(mesh);
            this.bulletPool.push({
                mesh: mesh,
                active: false,
                velocity: new THREE.Vector3(),
                damage: 0,
                owner: null,
                life: 0
            });
        }
    }
    
    fire(origin, direction, damage, speed, owner) {
        // Find inactive bullet
        const bullet = this.bulletPool.find(b => !b.active);
        if (!bullet) return; // Pool exhausted
        
        bullet.active = true;
        bullet.mesh.position.copy(origin);
        bullet.mesh.visible = true;
        bullet.velocity.copy(direction).multiplyScalar(speed);
        bullet.damage = damage;
        bullet.owner = owner;
        bullet.life = 3; // Seconds
        
        // Trail effect
        bullet.mesh.material.color.setHex(owner === 'player' ? 0x00ffff : 0xff0000);
    }
    
    update(deltaTime, targets) {
        for (const bullet of this.bulletPool) {
            if (!bullet.active) continue;
            
            // Move bullet
            const moveStep = bullet.velocity.clone().multiplyScalar(deltaTime);
            bullet.mesh.position.add(moveStep);
            
            // Decrease life
            bullet.life -= deltaTime;
            if (bullet.life <= 0) {
                this.deactivate(bullet);
                continue;
            }
            
            // Check collisions with targets
            for (const target of targets) {
                if (target.isDead) continue;
                if (bullet.owner === 'player' && target === targets[0]) continue; // Don't hit self
                if (bullet.owner === 'enemy' && target !== targets[0]) continue; // Enemies don't hit each other
                
                const dist = bullet.mesh.position.distanceTo(target.position);
                if (dist < 1.5) { // Hit radius
                    target.takeDamage(bullet.damage, bullet.owner === 'player' ? 'player' : 'enemy');
                    
                    // Show hit marker if player hit enemy
                    if (bullet.owner === 'player' && target !== targets[0]) {
                        this.showHitMarker();
                        if (target.isDead) {
                            targets[0].addKill();
                        }
                    }
                    
                    this.deactivate(bullet);
                    break;
                }
            }
            
            // Ground collision
            if (bullet.mesh.position.y < this.world.getGroundHeight(
                bullet.mesh.position.x, 
                bullet.mesh.position.z
            )) {
                this.deactivate(bullet);
            }
        }
    }
    
    deactivate(bullet) {
        bullet.active = false;
        bullet.mesh.visible = false;
    }
    
    showHitMarker() {
        const marker = document.getElementById('hit-marker');
        marker.classList.add('active');
        setTimeout(() => marker.classList.remove('active'), 100);
    }
    
    cleanup() {
        for (const bullet of this.bulletPool) {
            this.world.scene.remove(bullet.mesh);
            bullet.mesh.geometry.dispose();
            bullet.mesh.material.dispose();
        }
    }
}
