import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class SafeZone {
    constructor() {
        this.currentCenter = new THREE.Vector3(0, 0, 0);
        this.currentRadius = 100;
        this.targetCenter = new THREE.Vector3(0, 0, 0);
        this.targetRadius = 100;
        this.shrinkSpeed = 2; // Units per second
        this.shrinkInterval = 60; // Seconds between shrinks
        this.lastShrinkTime = 0;
        this.damage = 10;
        
        this.visualMesh = null;
    }
    
    init(mapSize) {
        this.currentRadius = mapSize / 2;
        this.targetRadius = mapSize / 2;
        this.createVisual();
    }
    
    createVisual() {
        // Create circle on ground
        const geometry = new THREE.RingGeometry(0.9, 1, 64);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        
        this.visualMesh = new THREE.Mesh(geometry, material);
        this.visualMesh.rotation.x = -Math.PI / 2;
        this.visualMesh.position.y = 0.2;
        
        // Add to scene (will be added when world is created)
        if (window.gameScene) {
            window.gameScene.add(this.visualMesh);
        }
    }
    
    update(deltaTime, matchTime) {
        // Check if time to shrink
        if (matchTime - this.lastShrinkTime > this.shrinkInterval) {
            this.startNewShrink();
            this.lastShrinkTime = matchTime;
        }
        
        // Smoothly shrink current zone to target
        if (this.currentRadius > this.targetRadius) {
            this.currentRadius = Math.max(
                this.targetRadius,
                this.currentRadius - this.shrinkSpeed * deltaTime
            );
        }
        
        // Move center toward target
        this.currentCenter.lerp(this.targetCenter, deltaTime * 0.5);
        
        // Update visual
        if (this.visualMesh) {
            this.visualMesh.position.x = this.currentCenter.x;
            this.visualMesh.position.z = this.currentCenter.z;
            const scale = this.currentRadius;
            this.visualMesh.scale.set(scale, scale, scale);
            
            // Pulse effect
            const pulse = 1 + Math.sin(matchTime * 2) * 0.05;
            this.visualMesh.scale.multiplyScalar(pulse);
        }
        
        // Update timer UI
        const timer = document.getElementById('storm-timer');
        if (timer) {
            const remaining = Math.max(0, this.shrinkInterval - (matchTime - this.lastShrinkTime));
            timer.textContent = Math.ceil(remaining);
        }
    }
    
    startNewShrink() {
        // Pick random new center within current zone
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.currentRadius * 0.5;
        
        this.targetCenter.x = this.currentCenter.x + Math.cos(angle) * distance;
        this.targetCenter.z = this.currentCenter.z + Math.sin(angle) * distance;
        
        // Reduce radius
        this.targetRadius = Math.max(20, this.currentRadius * 0.6);
        
        // Visual feedback
        this.showShrinkWarning();
    }
    
    showShrinkWarning() {
        // Add warning to UI
        const warning = document.createElement('div');
        warning.className = 'storm-warning';
        warning.textContent = 'STORM SHRINKING!';
        warning.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            font-size: 32px;
            font-weight: bold;
            border-radius: 10px;
            animation: fadeOut 3s forwards;
            z-index: 50;
        `;
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 3000);
    }
    
    isInZone(position) {
        return position.distanceTo(this.currentCenter) <= this.currentRadius;
    }
}
