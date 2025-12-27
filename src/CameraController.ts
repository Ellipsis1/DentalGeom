import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'
import { MeshManager } from './MeshManager'
import {
    ANIMATION_CONFIG,
    VIEW_DIRECTIONS,
    type ViewDirection
} from './Constants'

/**
 * Manages camera positioning, view switching, and smooth animations
 */
export class CameraController {
    private camera: THREE.OrthographicCamera
    private controls: OrbitControls
    private meshManager: MeshManager

    constructor(
        camera: THREE.OrthographicCamera,
        controls: OrbitControls,
        meshManager: MeshManager
    ) {
        this.camera = camera
        this.controls = controls
        this.meshManager = meshManager
    }

    /**
     * Centers the camera on all loaded meshes with smooth animation
     * Sets to front view as default
     */
    public centerCameraOnMeshes(): void {
        const boundingBox = this.meshManager.getBoundingBox()
        if (boundingBox.isEmpty()) {
            console.warn('No meshes to center on')
            return
        }

        // Get center and size of bounding box
        const center = new THREE.Vector3()
        boundingBox.getCenter(center)

        const size = new THREE.Vector3()
        boundingBox.getSize(size)

        // Calculate the distance needed to fit the object in view
        const maxDim = Math.max(size.x, size.y, size.z)
        const cameraDistance = Math.abs(maxDim)

        const frontViewConfig = VIEW_DIRECTIONS.FRONT

        // Set to front view (looking from above) as default
        this.camera.position.set(center.x, center.y + cameraDistance, center.z)
        this.camera.up.set(
            frontViewConfig.up.x,
            frontViewConfig.up.y,
            frontViewConfig.up.z
        )
        this.camera.lookAt(center)

        this.controls.target.copy(center)
        this.controls.update()

        console.log('Camera centered on meshes (front view)')
    }

    /**
     * Switches camera to a specific view with smooth animation
     * @param view - The view direction to switch to (top, bottom, front, back, left, right)
     */
    public setCameraView(view: string): void {
        const boundingBox = this.meshManager.getBoundingBox()
        if (boundingBox.isEmpty()) {
            console.warn('No meshes loaded - cannot set view')
            return
        }

        const center = new THREE.Vector3()
        boundingBox.getCenter(center)

        const size = new THREE.Vector3()
        boundingBox.getSize(size)
        const distance = Math.max(size.x, size.y, size.z)

        const { targetPosition, targetUp } = this.getViewConfiguration(view, center, distance)

        if (!targetPosition || !targetUp) {
            console.warn(`Unknown view: ${view}`)
            return
        }

        this.animateCameraTransition(targetPosition, targetUp, center)
    }

    /**
     * Gets the camera position and up vector for a specific view
     */
    private getViewConfiguration(
        view: string,
        center: THREE.Vector3,
        distance: number
    ): { targetPosition: THREE.Vector3 | null; targetUp: THREE.Vector3 | null } {
        // Convert string to uppercase to match VIEW_DIRECTIONS keys
        const viewKey = view.toUpperCase() as ViewDirection

        // Check if view exists in configuration
        const viewConfig = VIEW_DIRECTIONS[viewKey]
        if (!viewConfig) {
            return { targetPosition: null, targetUp: null }
        }

        // Calculate position based on view direction
        const targetPosition = this.calculatePositionForView(viewKey, center, distance)

        // Get up vector from configuration
        const targetUp = new THREE.Vector3(
            viewConfig.up.x,
            viewConfig.up.y,
            viewConfig.up.z
        )

        return { targetPosition, targetUp }
    }

    /**
     * Calculates camera position for a given view direction
     */
    private calculatePositionForView(
        view: ViewDirection,
        center: THREE.Vector3,
        distance: number
    ): THREE.Vector3 {
        switch (view) {
            case 'TOP':
                // Looking down from above (Z+)
                return new THREE.Vector3(center.x, center.y, center.z + distance)
            case 'BOTTOM':
                // Looking up from below (Z-)
                return new THREE.Vector3(center.x, center.y, center.z - distance)
            case 'FRONT':
                // Looking from front (Y+)
                return new THREE.Vector3(center.x, center.y + distance, center.z)
            case 'BACK':
                // Looking from back (Y-)
                return new THREE.Vector3(center.x, center.y - distance, center.z)
            case 'LEFT':
                // Looking from left side (X+)
                return new THREE.Vector3(center.x + distance, center.y, center.z)
            case 'RIGHT':
                // Looking from right side (X-)
                return new THREE.Vector3(center.x - distance, center.y, center.z)
            default:
                return center
        }
    }

    /**
     * Animates a smooth camera transition to a new position and orientation
     */
    private animateCameraTransition(
        targetPosition: THREE.Vector3,
        targetUp: THREE.Vector3,
        targetCenter: THREE.Vector3
    ): void {
        const startPosition = this.camera.position.clone()
        const startUp = this.camera.up.clone()
        const startTarget = this.controls.target.clone()

        const startTime = Date.now()
        const duration = ANIMATION_CONFIG.DURATION_MS

        const animate = () => {
            const elapsedTime = Date.now() - startTime
            const progress = Math.min(elapsedTime / duration, 1)

            // Ease-in-out function for smooth animation
            const eased = progress < ANIMATION_CONFIG.EASING_THRESHOLD
                ? ANIMATION_CONFIG.EASING_POWER * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2

            // Interpolate position, up vector, and target
            this.camera.position.lerpVectors(startPosition, targetPosition, eased)
            this.camera.up.lerpVectors(startUp, targetUp, eased)
            this.controls.target.lerpVectors(startTarget, targetCenter, eased)

            this.camera.lookAt(this.controls.target)
            this.controls.update()

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        animate()
    }
}
