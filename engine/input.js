export class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0 };
        this.mouseButtons = {};
        this.isPointerLocked = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if(['Space', 'ShiftLeft', 'ShiftRight', 'Tab'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouse.deltaX = e.movementX;
                this.mouse.deltaY = e.movementY;
            } else {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            }
        });
        
        document.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
        });
        
        // Pointer lock
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement !== null;
        });
    }
    
    isKeyPressed(code) {
        return !!this.keys[code];
    }
    
    isMouseDown(button) {
        return !!this.mouseButtons[button];
    }
    
    getMouseDelta() {
        const delta = { x: this.mouse.deltaX, y: this.mouse.deltaY };
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        return delta;
    }
    
    reset() {
        this.keys = {};
        this.mouseButtons = {};
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
}
