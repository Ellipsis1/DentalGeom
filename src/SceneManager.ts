import * as THREE from 'three'
import { OrbitControls } from "three-stdlib"
import {
    CAMERA_CONFIG,
    CONTROLS_CONFIG,
    LIGHTING_CONFIG,
    SCENE_CONFIG,
    RENDERER_CONFIG
} from "./Constants.ts"

/**
 * Manages the Three.js scene, camera, renderer and lighting
 */

export class SceneManager {
    public scene: THREE.Scene
    public camera: THREE.OrthographicCamera
    public renderer: THREE.WebGLRenderer
    public controls: OrbitControls


    constructor() {
        this.scene = this.createScene()
        this.camera = this.createCamera()
        this.renderer = this.createRenderer()
        this.controls = this.createControls()
        this.setupLighting()
        this.setupWindowResize()
    }

    /**
     * Creates and configures the Three.js scene
     */
    private createScene(): THREE.Scene {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(SCENE_CONFIG.BACKGROUND_COLOR)
        return scene;
    }

    /**
     * Creates and configures the orthographic camera
     */
    private createCamera(): THREE.OrthographicCamera {
        const aspect = window.innerWidth / window.innerHeight
        const frustumSize = CAMERA_CONFIG.FRUSTUM_SIZE

        const camera = new THREE.OrthographicCamera(
            -frustumSize * aspect / 2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            -frustumSize / 2,
            CAMERA_CONFIG.NEAR_PLANE,
            CAMERA_CONFIG.FAR_PLANE
        )

        camera.position.set(
            CAMERA_CONFIG.DEFAULT_POSITION.x,
            CAMERA_CONFIG.DEFAULT_POSITION.y,
            CAMERA_CONFIG.DEFAULT_POSITION.z
        )

        camera.lookAt(
            CAMERA_CONFIG.DEFAULT_LOOK_AT.x,
            CAMERA_CONFIG.DEFAULT_LOOK_AT.y,
            CAMERA_CONFIG.DEFAULT_LOOK_AT.z
        )

        return camera
    }

    /**
     * Creates and configures the WebGL renderer
     */
    private createRenderer(): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({
            antialias: RENDERER_CONFIG.ANTIALIAS
        })

        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.localClippingEnabled = RENDERER_CONFIG.LOCAL_CLIPPING_ENABLED

        document.body.appendChild(renderer.domElement)

        return renderer
    }

    /**
     * Creates and configures orbit controls
     */

    private createControls(): OrbitControls {
        const controls = new OrbitControls(this.camera, this.renderer.domElement)

        controls.enableDamping = CONTROLS_CONFIG.ENABLE_DAMPING
        controls.dampingFactor = CONTROLS_CONFIG.DAMPING_FACTOR
        controls.target.set(
            CONTROLS_CONFIG.DEFAULT_TARGET.x,
            CONTROLS_CONFIG.DEFAULT_TARGET.y,
            CONTROLS_CONFIG.DEFAULT_TARGET.z
        )
        controls.update()

        return controls
    }

    /**
     * Sets up all scene lighting
     */

    private setupLighting(): void {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(
            LIGHTING_CONFIG.AMBIENT.COLOR,
            LIGHTING_CONFIG.AMBIENT.INTENSITY
        )
        this.scene.add(ambientLight)

        // Key light
        const keyLight = new THREE.DirectionalLight(
            LIGHTING_CONFIG.KEY_LIGHT.COLOR,
            LIGHTING_CONFIG.KEY_LIGHT.INTENSITY
        )
        keyLight.position.set(
            LIGHTING_CONFIG.KEY_LIGHT.POSITION.x,
            LIGHTING_CONFIG.KEY_LIGHT.POSITION.y,
            LIGHTING_CONFIG.KEY_LIGHT.POSITION.z
        )
        this.scene.add(keyLight)

        // Fill light
        const fillLight = new THREE.DirectionalLight(
            LIGHTING_CONFIG.FILL_LIGHT.COLOR,
            LIGHTING_CONFIG.FILL_LIGHT.INTENSITY
        )
        fillLight.position.set(
            LIGHTING_CONFIG.FILL_LIGHT.POSITION.x,
            LIGHTING_CONFIG.FILL_LIGHT.POSITION.y,
            LIGHTING_CONFIG.FILL_LIGHT.POSITION.z
        )
        this.scene.add(fillLight)

        // Rim light
        const rimLight = new THREE.DirectionalLight(
            LIGHTING_CONFIG.RIM_LIGHT.COLOR,
            LIGHTING_CONFIG.RIM_LIGHT.INTENSITY
        )
        rimLight.position.set(
            LIGHTING_CONFIG.RIM_LIGHT.POSITION.x,
            LIGHTING_CONFIG.RIM_LIGHT.POSITION.y,
            LIGHTING_CONFIG.RIM_LIGHT.POSITION.z
        )
        this.scene.add(rimLight)

        // Hemisphere light
        const hemiLight = new THREE.HemisphereLight(
            LIGHTING_CONFIG.HEMISPHERE.SKY_COLOR,
            LIGHTING_CONFIG.HEMISPHERE.GROUND_COLOR,
            LIGHTING_CONFIG.HEMISPHERE.INTENSITY
        )
        this.scene.add(hemiLight)
    }
    /**
     * Sets up window resize handler to maintain proper camera aspect ratio
     */
    private setupWindowResize(): void {
        window.addEventListener('resize', () => {
            this.handleResize()
        })
    }

    /**
     * Handles window resize events, updating camera and renderer
     * Maintains proper aspect ratio for orthographic camera
     */
    private handleResize(): void {
        const aspect = window.innerWidth / window.innerHeight
        const frustumSize = CAMERA_CONFIG.FRUSTUM_SIZE

        // Update camera frustum to maintain aspect ratio
        this.camera.left = -frustumSize * aspect / 2
        this.camera.right = frustumSize * aspect / 2
        this.camera.top = frustumSize / 2
        this.camera.bottom = -frustumSize / 2
        this.camera.updateProjectionMatrix()

        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    /**
     * Starts the animation loop
     */
    public startAnimationLoop(): void {
        const animate = () => {
            requestAnimationFrame(animate)
            this.controls.update()
            this.renderer.render(this.scene, this.camera)
        }
        animate()
    }

    /**
     * Disposes of all Three.js resources
     */
    public dispose(): void {
        this.controls.dispose()
        this.renderer.dispose()

        // Remove renderer from DOM
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
        }
    }
}