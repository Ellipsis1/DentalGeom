import './style.css'
import { SceneManager } from './SceneManager'
import { MeshManager } from './MeshManager'
import { CameraController } from './CameraController'
import { UIController } from './UIController'

/**
 * Application entry point
 * Initializes all managers and starts the application
 */
function initializeApp(): void {
    try {
        // Get required DOM elements
        const meshListElement = document.getElementById('meshList')
        if (!meshListElement) {
            throw new Error('Required element #meshList not found')
        }

        // Initialize scene (Three.js setup)
        const sceneManager = new SceneManager()

        // Initialize mesh manager
        const meshManager = new MeshManager(sceneManager.scene, meshListElement)

        // Initialize camera controller
        const cameraController = new CameraController(
            sceneManager.camera,
            sceneManager.controls,
            meshManager
        )

        // Set callback to center camera when mesh is loaded
        meshManager.setOnMeshLoaded(() => {
            cameraController.centerCameraOnMeshes()
        })

        // Initialize UI controller
        const uiController = new UIController(meshManager, cameraController)
        uiController.initialize()

        // Start animation loop
        sceneManager.startAnimationLoop()

        // Setup cleanup on window close
        window.addEventListener('beforeunload', () => {
            meshManager.disposeAll()
            sceneManager.dispose()
        })

        console.log('DentalGeom initialized successfully')
    } catch (error) {
        console.error('Failed to initialize application:', error)

        // Display error to user
        document.body.innerHTML = `
            <div style="padding: 20px; color: #ff6b6b; font-family: sans-serif;">
                <h1>Initialization Error</h1>
                <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
                <p>Please check the console for details and refresh the page.</p>
            </div>
        `
    }
}

// Start the application
initializeApp()