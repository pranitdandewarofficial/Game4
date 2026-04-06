import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Player {
    constructor(spawnPosition, input) {
        this.input = input;
        this.position = new THREE.Vector3(spawnPosition.x, spawnPosition.y, spawnPosition.z);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3();
        
        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.armor = 0;
        this.maxArmor = 100;
        this.isDead = false;
        this.kills = 0;
        
        // Movement
        this.speed = 8;
        this.sprintSpeed = 14;
        this.jumpForce = 8;
        this.isGrounded = true;
        this.isSprinting = false;
        
        // Camera control
        this.mouseSensitivity = 0.002;
        this.pitch = 0;
        this.yaw = 0;
        
        // Create mesh
        this.createMesh();
        
        // Weapon mount point
        this.weaponOffset = new THREE.Vector3(0.5, 1.2, 0.5);
    }
    
    createMesh() {
        // Simple capsule body
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        
        // Add a "head" for visual reference
        const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const headMat = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1;
        this.mesh.add(this.head);
    }
    
    update(deltaTime, world) {
        if (this.isDead) return;
        
        // Handle rotation from mouse
        const mouseDelta = this.input.getMouseDelta();
        this.yaw -= mouseDelta.x * this.mouseSensitivity;
        this.pitch -= mouseDelta.y * this.mouseSensitivity;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        
        this.rotation.y = this.yaw;
        
        // Movement input
        let moveX = 0;
        let moveZ = 0;
        
        if (this.input.isKeyPressed('KeyW')) moveZ += 1;
        if (this.input.isKeyPressed('KeyS')) moveZ -= 1;
        if (this.input.isKeyPressed('KeyA')) moveX -= 1;
        if (this.input.isKeyPressed('KeyD')) moveX += 1;
        
        // Sprint
        this.isSprinting = this.input.isKeyPressed('ShiftLeft') && moveZ > 0;
        const currentSpeed = this.isSprinting ? this.sprintSpeed : this.speed;
        
        // Calculate movement direction relative to camera
        if (moveX !== 0 || moveZ !== 0) {
            const angle = Math.atan2(moveX, moveZ) + this.yaw;
            this.velocity.x = Math.sin(angle) * currentSpeed;
            this.velocity.z = Math.cos(angle) * currentSpeed;
        } else {
            this.velocity.x *= 0.8; // Friction
            this.velocity.z *= 0.8;
        }
        
        // Jump
        if (this.input.isKeyPressed('Space') && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
        
        // Gravity
        if (!this.isGrounded) {
            this.velocity.y -= 25 * deltaTime; // Gravity
        }
        
        // Apply velocity
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        
        // Ground collision
        const groundHeight = world.getGroundHeight(this.position.x, this.position.z);
        if (this.position.y <= groundHeight + 1) {
            this.position.y = groundHeight + 1;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        
        // World bounds
        this.position.x = Math.max(-world.mapSize/2, Math.min(world.mapSize/2, this.position.x));
        this.position.z = Math.max(-world.mapSize/2, Math.min(world.mapSize/2, this.position.z));
        
        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
        
        // Head looks up/down
        this.head.rotation.x = this.pitch;
    }
    
    takeDamage(amount, source = 'unknown') {
        if (this.isDead) return;
        
        // Armor absorbs damage first
        if (this.armor > 0) {
            const armorAbsorb = Math.min(this.armor, amount * 0.8);
            this.armor -= armorAbsorb;
            amount -= armorAbsorb;
        }
        
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die(source);
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    addArmor(amount) {
        this.armor = Math.min(this.maxArmor, this.armor + amount);
    }
    
    die(source) {
        this.isDead = true;
        this.mesh.visible = false;
        console.log(`Player died to ${source}`);
    }
    
    respawn(position) {
        this.health = this.maxHealth;
        this.armor = 0;
        this.isDead = false;
        this.mesh.visible = true;
        this.position.copy(position);
        this.velocity.set(0, 0, 0);
    }
    
    getShootOrigin() {
        const origin = this.position.clone();
        origin.y += 1.5; // Eye level
        return origin;
    }
    
    getShootDirection() {
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0));
        return direction;
    }
    
    addKill() {
        this.kills++;
    }
}
