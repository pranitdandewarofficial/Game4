import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class World {
    constructor() {
        this.mapSize = 200;
        this.scene = new THREE.Scene();
        this.ground = null;
        this.buildings = [];
        this.obstacles = [];
        this.spawnPoints = [];
    }
    
    generate() {
        this.createGround();
        this.createBuildings();
        this.createObstacles();
        this.generateSpawnPoints();
    }
    
    createGround() {
        // Main terrain
        const geometry = new THREE.PlaneGeometry(this.mapSize, this.mapSize, 50, 50);
        
        // Add some height variation
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const height = this.getNoiseHeight(x, y);
            positions.setZ(i, height);
        }
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x3a5f0b,
            side: THREE.DoubleSide
        });
        
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Grid helper for visual reference
        const grid = new THREE.GridHelper(this.mapSize, 20, 0x000000, 0x444444);
        grid.position.y = 0.1;
        this.scene.add(grid);
    }
    
    createBuildings() {
        const buildingCount = 15;
        const minSize = 5;
        const maxSize = 15;
        
        for (let i = 0; i < buildingCount; i++) {
            const width = minSize + Math.random() * (maxSize - minSize);
            const depth = minSize + Math.random() * (maxSize - minSize);
            const height = 5 + Math.random() * 15;
            
            const x = (Math.random() - 0.5) * (this.mapSize - 40);
            const z = (Math.random() - 0.5) * (this.mapSize - 40);
            
            // Create building
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 0.5, 0.5)
            });
            
            const building = new THREE.Mesh(geometry, material);
            building.position.set(x, height / 2, z);
            building.castShadow = true;
            building.receiveShadow = true;
            
            this.scene.add(building);
            this.buildings.push({
                mesh: building,
                bounds: new THREE.Box3().setFromObject(building)
            });
        }
    }
    
    createObstacles() {
        // Add rocks, trees, barriers
        const obstacleCount = 30;
        
        for (let i = 0; i < obstacleCount; i++) {
            const type = Math.random() > 0.5 ? 'rock' : 'barrier';
            const x = (Math.random() - 0.5) * this.mapSize;
            const z = (Math.random() - 0.5) * this.mapSize;
            
            let mesh;
            if (type === 'rock') {
                const size = 1 + Math.random() * 2;
                const geometry = new THREE.DodecahedronGeometry(size, 0);
                const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
                mesh = new THREE.Mesh(geometry, material);
            } else {
                const geometry = new THREE.BoxGeometry(3, 1.5, 0.5);
                const material = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
                mesh = new THREE.Mesh(geometry, material);
            }
            
            mesh.position.set(x, type === 'rock' ? size/2 : 0.75, z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.rotation.y = Math.random() * Math.PI;
            
            this.scene.add(mesh);
            this.obstacles.push(mesh);
        }
    }
    
    generateSpawnPoints() {
        // Create grid of spawn points
        const spacing = 20;
        const offset = this.mapSize / 2 - 10;
        
        for (let x = -offset; x <= offset; x += spacing) {
            for (let z = -offset; z <= offset; z += spacing) {
                this.spawnPoints.push({ x, y: this.getGroundHeight(x, z) + 1, z });
            }
        }
    }
    
    getRandomSpawnPoint() {
        return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
    }
    
    getGroundHeight(x, z) {
        // Simple noise function
        return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2;
    }
    
    getNoiseHeight(x, y) {
        return Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2;
    }
    
    checkCollision(position, radius = 0.5) {
        // Check building collisions
        const playerBox = new THREE.Box3();
        playerBox.setFromCenterAndSize(
            position,
            new THREE.Vector3(radius * 2, 2, radius * 2)
        );
        
        for (const building of this.buildings) {
            if (playerBox.intersectsBox(building.bounds)) {
                return true;
            }
        }
        
        return false;
    }
}
