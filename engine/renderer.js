import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.cameraOffset = new THREE.Vector3(0, 5, -8);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        this.setupLighting();
        
        // Entities to render
        this.entities = [];
        this.player = null;
        
        // Camera smoothing
        this.cameraVelocity = new THREE.Vector3();
    }
    
    setupLighting() {
        // Ambient
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 500;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        this.scene.add(dirLight);
    }
    
    setScene(scene) {
        // Add world scene objects
        while(scene.children.length > 0) {
            this.scene.add(scene.children[0]);
        }
    }
    
    setPlayer(player) {
        this.player = player;
    }
    
    addEntity(mesh) {
        this.scene.add(mesh);
        this.entities.push(mesh);
    }
    
    removeEntity(mesh) {
        this.scene.remove(mesh);
        const index = this.entities.indexOf(mesh);
        if (index > -1) this.entities.splice(index, 1);
    }
    
    updateCamera(deltaTime) {
        if (!this.player) return;
        
        const targetPos = this.player.position.clone().add(this.cameraOffset);
        targetPos.y += 3; // Height offset
        
        // Smooth follow
        const lerpFactor = 1 - Math.exp(-5 * deltaTime);
        this.camera.position.lerp(targetPos, lerpFactor);
        
        // Look at player
        const lookTarget = this.player.position.clone();
        lookTarget.y += 1.5;
        this.camera.lookAt(lookTarget);
        
        // Rotate based on mouse
        const rotationX = this.player.rotation.y;
        const radius = 8;
        this.camera.position.x = this.player.position.x - Math.sin(rotationX) * radius;
        this.camera.position.z = this.player.position.z - Math.cos(rotationX) * radius;
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }
    
    cleanup() {
        this.renderer.dispose();
    }
    
    getCamera() {
        return this.camera;
    }
}
