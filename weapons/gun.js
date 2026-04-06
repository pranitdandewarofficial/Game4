import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class WeaponSystem {
    constructor(player) {
        this.player = player;
        this.currentWeaponIndex = 0;
        this.weapons = [];
        this.lastShotTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        
        this.initWeapons();
    }
    
    initWeapons() {
        // Assault Rifle
        this.weapons.push({
            name: 'AR-15',
            type: 'auto',
            damage: 25,
            fireRate: 100, // ms between shots
            magazineSize: 30,
            currentAmmo: 30,
            totalAmmo: 90,
            reloadTime: 2000,
            range: 100,
            speed: 100,
            recoil: 0.05,
            spread: 0.02
        });
        
        // Sniper
        this.weapons.push({
            name: 'AWP',
            type: 'semi',
            damage: 100,
            fireRate: 1000,
            magazineSize: 5,
            currentAmmo: 5,
            totalAmmo: 25,
            reloadTime: 3000,
            range: 200,
            speed: 150,
            recoil: 0.3,
            spread: 0.001,
            zoomLevel: 2
        });
        
        // SMG
        this.weapons.push({
            name: 'MP5',
            type: 'auto',
            damage: 15,
            fireRate: 80,
            magazineSize: 40,
            currentAmmo: 40,
            totalAmmo: 120,
            reloadTime: 1500,
            range: 60,
            speed: 80,
            recoil: 0.03,
            spread: 0.04
        });
        
        // Start with AR
        this.currentWeapon = this.weapons[0];
    }
    
    update(deltaTime) {
        // Handle reload
        if (this.isReloading) {
            const elapsed = performance.now() - this.reloadStartTime;
            if (elapsed >= this.currentWeapon.reloadTime) {
                this.finishReload();
            }
        }
        
        // Weapon switching
        if (this.player.input.isKeyPressed('Digit1')) this.switchWeapon(0);
        if (this.player.input.isKeyPressed('Digit2')) this.switchWeapon(1);
        if (this.player.input.isKeyPressed('Digit3')) this.switchWeapon(2);
        
        // Reload key
        if (this.player.input.isKeyPressed('KeyR')) {
            this.startReload();
        }
    }
    
    switchWeapon(index) {
        if (index !== this.currentWeaponIndex && index < this.weapons.length) {
            this.currentWeaponIndex = index;
            this.currentWeapon = this.weapons[index];
            this.isReloading = false;
        }
    }
    
    shoot() {
        const now = performance.now();
        const weapon = this.currentWeapon;
        
        // Check if can shoot
        if (this.isReloading) return null;
        if (weapon.currentAmmo <= 0) {
            this.startReload();
            return null;
        }
        if (now - this.lastShotTime < weapon.fireRate) return null;
        
        // Consume ammo
        weapon.currentAmmo--;
        this.lastShotTime = now;
        
        // Calculate spread
        const spreadX = (Math.random() - 0.5) * weapon.spread;
        const spreadY = (Math.random() - 0.5) * weapon.spread;
        
        const direction = this.player.getShootDirection();
        direction.x += spreadX;
        direction.y += spreadY;
        direction.normalize();
        
        // Apply recoil to player view
        this.player.pitch -= weapon.recoil;
        
        return {
            origin: this.player.getShootOrigin(),
            direction: direction,
            damage: weapon.damage,
            speed: weapon.speed,
            weapon: weapon.name
        };
    }
    
    startReload() {
        if (this.isReloading) return;
        if (this.currentWeapon.currentAmmo >= this.currentWeapon.magazineSize) return;
        if (this.currentWeapon.totalAmmo <= 0) return;
        
        this.isReloading = true;
        this.reloadStartTime = performance.now();
    }
    
    finishReload() {
        const weapon = this.currentWeapon;
        const needed = weapon.magazineSize - weapon.currentAmmo;
        const available = Math.min(needed, weapon.totalAmmo);
        
        weapon.currentAmmo += available;
        weapon.totalAmmo -= available;
        this.isReloading = false;
    }
    
    addAmmo(weaponType, amount) {
        const weapon = this.weapons.find(w => w.name === weaponType);
        if (weapon) {
            weapon.totalAmmo += amount;
        }
    }
    
    getCurrentWeapon() {
        return this.currentWeapon;
    }
    
    isReloading() {
        return this.isReloading;
    }
}
