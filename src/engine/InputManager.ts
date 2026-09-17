export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  interact: boolean;
  rotate: boolean;
  leftClick: boolean;
  rightClick: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
  pointerLocked: boolean;
}

export class InputManager {
  private state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    interact: false,
    rotate: false,
    leftClick: false,
    rightClick: false,
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    pointerLocked: false,
  };

  private targetElement: HTMLElement | null = null;
  private isMouseDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private onInteractCallback?: () => void;
  private onRotateCallback?: () => void;
  private onLeftClickCallback?: () => void;
  private onRightClickCallback?: () => void;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
  }

  private handlePointerLockError() {
    // Silently handled: pointer lock denied or unsupported in embedded context
  }

  public attach(element: HTMLElement) {
    this.targetElement = element;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    element.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    element.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('pointerlockerror', this.handlePointerLockError);
  }

  public detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    if (this.targetElement) {
      this.targetElement.removeEventListener('mousedown', this.handleMouseDown);
      this.targetElement.removeEventListener('contextmenu', this.handleContextMenu);
    }
    window.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('pointerlockerror', this.handlePointerLockError);
  }

  public setCallbacks(callbacks: {
    onInteract?: () => void;
    onRotate?: () => void;
    onLeftClick?: () => void;
    onRightClick?: () => void;
  }) {
    this.onInteractCallback = callbacks.onInteract;
    this.onRotateCallback = callbacks.onRotate;
    this.onLeftClickCallback = callbacks.onLeftClick;
    this.onRightClickCallback = callbacks.onRightClick;
  }

  public getState(): InputState {
    return this.state;
  }

  public resetDeltas() {
    this.state.mouseDeltaX = 0;
    this.state.mouseDeltaY = 0;
    this.state.leftClick = false;
    this.state.rightClick = false;
    this.state.interact = false;
    this.state.rotate = false;
    this.state.jump = false;
  }

  public requestPointerLock() {
    if (this.targetElement && document.pointerLockElement !== this.targetElement) {
      try {
        const ret = this.targetElement.requestPointerLock() as unknown;
        if (ret && typeof (ret as Promise<void>).catch === 'function') {
          (ret as Promise<void>).catch(() => {
            // Handled silently: pointer lock may be restricted in sandboxed iframes
          });
        }
      } catch {
        // Pointer lock not permitted in this iframe context; mouse drag fallback active
      }
    }
  }

  public exitPointerLock() {
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch {
      // Ignored
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = true;
        break;
      case 'Space':
        e.preventDefault();
        this.state.jump = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.sprint = true;
        break;
      case 'KeyE':
        e.preventDefault();
        this.state.interact = true;
        this.onInteractCallback?.();
        break;
      case 'KeyR':
        e.preventDefault();
        this.state.rotate = true;
        this.onRotateCallback?.();
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.sprint = false;
        break;
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (document.pointerLockElement === this.targetElement) {
      this.state.mouseDeltaX += e.movementX;
      this.state.mouseDeltaY += e.movementY;
    } else if (this.isMouseDown) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.state.mouseDeltaX += dx;
      this.state.mouseDeltaY += dy;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  }

  private handleMouseDown(e: MouseEvent) {
    this.isMouseDown = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    if (e.button === 0) {
      this.state.leftClick = true;
      this.onLeftClickCallback?.();
    } else if (e.button === 2) {
      this.state.rightClick = true;
      this.onRightClickCallback?.();
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (e.button === 0) {
      this.isMouseDown = false;
    }
  }

  private handleContextMenu(e: MouseEvent) {
    e.preventDefault();
  }

  private handlePointerLockChange() {
    this.state.pointerLocked = document.pointerLockElement === this.targetElement;
  }
}
