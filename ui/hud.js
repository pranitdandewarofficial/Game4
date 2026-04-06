export class HUD {
    constructor(player, weaponSystem, game) {
        this.player = player;
        this.weaponSystem = weaponSystem;
        this.game = game;
        
        this.elements = {
            healthFill: document.getElementById('health-fill'),
            healthText: document.getElementById('health-text'),
            armorFill: document.getElementById('armor-fill'),
            armorText: document.getElementById('armor-text'),
            weaponName: document.getElementById('weapon-name'),
            ammoCurrent: document.getElementById('ammo-current'),
            ammoTotal: document.getElementById('ammo-total'),
            aliveCount: document.getElementById('alive-count')
        };
        
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.minimapCanvas.width = 150;
        this.minimapCanvas.height = 150;
        
        this.lastUpdate = 0;
    }
    
    update(deltaTime) {
        // Throttle UI updates
        this.lastUpdate += deltaTime;
        if (this.lastUpdate < 0.05) return; // Update at 20fps
        this.lastUpdate = 0;
        
        const weapon = this.weaponSystem.getCurrentWeapon();
        
        // Health & Armor
        this.elements.healthFill.style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
        this.elements.healthText.textContent = Math.ceil(this.player.health);
        
        this.elements.armorFill.style.width = `${(this.player.armor / this.player.maxArmor) * 100}%`;
        this.elements.armorText.textContent = Math.ceil(this.player.armor);
        
        // Weapon info
        this.elements.weaponName.textContent = weapon.name;
        if (this.weaponSystem.isReloading) {
            this.elements.weaponName.textContent += ' [RELOADING]';
        }
        
        this.elements.ammoCurrent.textContent = weapon.currentAmmo;
        this.elements.ammoTotal.textContent = weapon.totalAmmo;
        
        // Low ammo warning
        const ammoContainer = this.elements.ammoCurrent.parentElement;
        if (weapon.currentAmmo <= 5) {
            ammoContainer.classList.add('low');
        } else {
            ammoContainer.classList.remove('low');
        }
        
        // Alive count
        this.elements.aliveCount.textContent = this.game.getAliveCount();
        
        // Update minimap
        this.updateMinimap();
    }
    
    updateMinimap() {
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;
        
        // Clear
        ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        ctx.fillRect(0, 0, w, h);
        
        // Draw safe zone
        const mapSize = this.game.world.mapSize;
        const scale = w / mapSize;
        
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            w/2 + this.game.safeZone.currentCenter.x * scale,
            h/2 - this.game.safeZone.currentCenter.z * scale,
            this.game.safeZone.currentRadius * scale,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        
        // Draw player (center of minimap)
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(w/2, h/2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw enemies
        ctx.fillStyle = '#ff0000';
        for (const enemy of this.game.enemies.getEnemies()) {
            if (enemy.isDead) continue;
            
            const relX = (enemy.position.x - this.player.position.x) * scale;
            const relZ = (enemy.position.z - this.player.position.z) * scale;
            
            // Clamp to minimap bounds
            if (Math.abs(relX) < w/2 && Math.abs(relZ) < h/2) {
                ctx.beginPath();
                ctx.arc(w/2 + relX, h/2 - relZ, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    showKillFeed(killer, victim) {
        const feed = document.getElementById('kill-feed');
        const entry = document.createElement('div');
        entry.className = 'kill-entry';
        entry.innerHTML = `<span class="killer">${killer}</span> eliminated <span class="victim">${victim}</span>`;
        feed.appendChild(entry);
        
        setTimeout(() => entry.remove(), 5000);
    }
}
