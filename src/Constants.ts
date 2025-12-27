/**
 * Application-wide Constants and Configuration
 */

// Mesh Colors
export const MESH_COLORS = [
    0xf5e6d3,  // Cream
    0x4ecdc4,  // Teal
    0xff6b6b,  // Red
    0xffe66d,  // Yellow
    0x95e1d3,  // Mint
    0xc7b8ea,  // Purple
] as const

// Camera Configuration
export const CAMERA_CONFIG = {
    FRUSTUM_SIZE: 100,
    NEAR_PLANE: 0.1,
    FAR_PLANE: 1000,
    DEFAULT_POSITION: {x: 20, y: 20, z: 20},
    DEFAULT_UP: {x: 0, y: 0, z: -1},
    DEFAULT_LOOK_AT: {x: 0, y: 0, z: -1}
} as const

// Camera Animation Configuration
export const ANIMATION_CONFIG = {
    DURATION_MS: 1000,
    EASING_THRESHOLD: 0.5,
    EASING_POWER: 2
} as const

// Controls Configuration
export const CONTROLS_CONFIG = {
    ENABLE_DAMPING: true,
    DAMPING_FACTOR: 0.05,
    DEFAULT_TARGET: {x: 0, y: 0, z: 0}
} as const

// Lighting Configuration
export const LIGHTING_CONFIG = {
    AMBIENT: {
        COLOR: 0xffffff,
        INTENSITY: 0.4
    },
    KEY_LIGHT: {
        COLOR: 0xffffff,
        INTENSITY: 1.2,
        POSITION: { x: 50, y: 100, z: 50 }
    },
    FILL_LIGHT: {
        COLOR: 0xffffff,
        INTENSITY: 0.6,
        POSITION: { x: -50, y: 50, z: -50 }
    },
    RIM_LIGHT: {
        COLOR: 0xffffff,
        INTENSITY: 0.7,
        POSITION: { x: 0, y: 50, z: -100 }
    },
    HEMISPHERE: {
        SKY_COLOR: 0xffffff,
        GROUND_COLOR: 0x444444,
        INTENSITY: 0.5
    }
} as const

// Scene Configuration
export const SCENE_CONFIG = {
    BACKGROUND_COLOR: 0x4a4a7a
} as const

// Renderer Configuration
export const RENDERER_CONFIG = {
    ANTIALIAS: true,
    LOCAL_CLIPPING_ENABLED: true
} as const

// File Configuration
export const FILE_CONFIG = {
    ACCEPTED_EXTENSIONS: ['.stl'],
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    DEMO_LOAD_DELAY_MS: 300
} as const

// Demo Files Configuration
export const DEMO_FILES = [
    { path: 'samples/maxilla.stl', name: 'maxilla.stl' },
    { path: 'samples/mandibular.stl', name: 'mandibular.stl' }
] as const

// View Directions Configuration
export const VIEW_DIRECTIONS = {
    TOP: { name: 'top', up: { x: 0, y: 1, z: 0 } },
    BOTTOM: { name: 'bottom', up: { x: 0, y: 1, z: 0 } },
    FRONT: { name: 'front', up: { x: 0, y: 0, z: -1 } },
    BACK: { name: 'back', up: { x: 0, y: 0, z: -1 } },
    LEFT: { name: 'left', up: { x: 0, y: 0, z: -1 } },
    RIGHT: { name: 'right', up: { x: 0, y: 0, z: -1 } }
} as const

export type ViewDirection = keyof typeof VIEW_DIRECTIONS