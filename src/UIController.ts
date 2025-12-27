import * as THREE from 'three'
import { MeshManager } from './MeshManager'
import { CameraController } from './CameraController'
import { FILE_CONFIG, DEMO_FILES } from './Constants'

/**
 * Handles all user interface interactions and DOM events
 */
export class UIController {
    private meshManager: MeshManager
    private cameraController: CameraController
    private allHidden: boolean = false

    constructor(meshManager: MeshManager, cameraController: CameraController) {
        this.meshManager = meshManager
        this.cameraController = cameraController
    }

    /**
     * Initializes all UI event listeners
     * Validates that required DOM elements exist
     */
    public initialize(): void {
        this.setupFileInput()
        this.setupDemoButton()
        this.setupHideAllButton()
        this.setupViewButtons()
        this.setupSettingsModal()
        this.setupCloseButton()
        this.setupMeshSectionCollapse()
        this.setupSettingsToggles()
    }

    /**
     * Sets up file input for STL loading
     */
    private setupFileInput(): void {
        const fileInput = document.getElementById('fileInput')
        if (!(fileInput instanceof HTMLInputElement)) {
            console.error('File input not found')
            return
        }

        fileInput.addEventListener('change', async (event) => {
            const target = event.target
            if (!(target instanceof HTMLInputElement)) return

            const file = target.files?.[0]
            if (!file) return

            if (!file.name.endsWith('.stl')) {
                alert('Please select an STL file')
                return
            }

            try {
                await this.meshManager.loadSTL(file)
            } catch (error) {
                console.error('Error loading STL:', error)
                alert('Failed to load STL file.')
            }

            // Reset input
            fileInput.value = ''
        })
    }

    /**
     * Sets up demo file loading button
     */
    private setupDemoButton(): void {
        const demoBtn = document.getElementById('loadDemoBtn')
        if (!demoBtn) {
            console.warn('Demo button not found')
            return
        }

        demoBtn.addEventListener('click', async () => {
            await this.loadDemoFiles()
        })
    }

    /**
     * Loads demo STL files
     */
    private async loadDemoFiles(): Promise<void> {
        const basePath = import.meta.env.BASE_URL

        for (const demo of DEMO_FILES) {
            try {
                const response = await fetch(`${basePath}${demo.path}`)
                const blob = await response.blob()
                const file = new File([blob], demo.name, { type: 'application/sla' })

                await this.meshManager.loadSTL(file)

                // Small delay between loading files
                await new Promise(resolve =>
                    setTimeout(resolve, FILE_CONFIG.DEMO_LOAD_DELAY_MS)
                )
            } catch (error) {
                console.error(`Error loading ${demo.name}:`, error)
            }
        }
    }

    /**
     * Sets up hide/show all meshes button
     */
    private setupHideAllButton(): void {
        const hideAllBtn = document.getElementById('hideAllBtn')
        if (!hideAllBtn) {
            console.warn('Hide All button not found')
            return
        }

        hideAllBtn.addEventListener('click', () => {
            this.allHidden = !this.allHidden
            this.meshManager.setAllVisible(!this.allHidden)
            hideAllBtn.textContent = this.allHidden ? 'Show All' : 'Hide All'
        })
    }

    /**
     * Sets up view direction buttons (top, bottom, left, right, front, back)
     */
    private setupViewButtons(): void {
        const viewButtons = document.querySelectorAll('.dir-btn')

        viewButtons.forEach(btn => {
            if (!(btn instanceof HTMLElement)) return

            btn.addEventListener('click', (event) => {
                const target = event.currentTarget
                if (!(target instanceof HTMLElement)) return

                const view = target.getAttribute('data-view')
                if (!view) {
                    console.warn('Button missing data-view attribute')
                    return
                }

                this.cameraController.setCameraView(view)
            })
        })
    }

    /**
     * Sets up settings modal open/close functionality
     */
    private setupSettingsModal(): void {
        const settingsBtn = document.getElementById('settingsBtn')
        const settingsModal = document.getElementById('settingsModal')
        const settingsOverlay = document.getElementById('settingsOverlay')
        const settingsClose = document.getElementById('settingsClose')

        if (!settingsModal || !settingsOverlay) {
            console.error('Settings modal elements not found')
            return
        }

        if (!settingsClose) {
            console.error('Settings close button not found')
            return
        }

        // Open modal
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                settingsModal.style.display = 'block'
                settingsOverlay.style.display = 'block'
            })
        }

        // Close modal via close button
        settingsClose.addEventListener('click', () => {
            settingsModal.style.display = 'none'
            settingsOverlay.style.display = 'none'
        })

        // Close modal via overlay click
        settingsOverlay.addEventListener('click', () => {
            settingsModal.style.display = 'none'
            settingsOverlay.style.display = 'none'
        })
    }

    /**
     * Sets up application close button
     */
    private setupCloseButton(): void {
        const closeBtn = document.getElementById('closeBtn')
        if (!closeBtn) {
            console.warn('Close button not found')
            return
        }

        closeBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to close DentalGeom?')) {
                window.close()
            }
        })
    }

    /**
     * Sets up mesh section collapse/expand functionality
     */
    private setupMeshSectionCollapse(): void {
        const meshSectionHeader = document.getElementById('meshSectionHeader')
        const meshListElement = document.getElementById('meshList')

        if (!meshSectionHeader || !meshListElement) {
            console.warn('Mesh section elements not found')
            return
        }

        meshSectionHeader.addEventListener('click', () => {
            meshSectionHeader.classList.toggle('collapsed')
            meshListElement.classList.toggle('collapsed')
        })
    }

    /**
     * Sets up settings toggles (flat shading, glossy texture)
     */
    private setupSettingsToggles(): void {
        this.setupFlatShadingToggle()
        this.setupGlossyTextureToggle()
    }

    /**
     * Sets up flat shading toggle
     */
    private setupFlatShadingToggle(): void {
        const flatShadingToggle = document.getElementById('flatShadingToggle')
        if (!(flatShadingToggle instanceof HTMLInputElement)) {
            console.warn('Flat shading toggle not found')
            return
        }

        flatShadingToggle.addEventListener('change', (event) => {
            const target = event.target
            if (!(target instanceof HTMLInputElement)) return

            const enabled = target.checked

            // Apply to all meshes
            this.meshManager.getMeshes().forEach(dentalMesh => {
                const material = dentalMesh.mesh.material as THREE.MeshStandardMaterial
                material.flatShading = enabled
                material.needsUpdate = true

                // Recompute normals
                const geometry = dentalMesh.mesh.geometry as THREE.BufferGeometry
                geometry.computeVertexNormals()
            })

            console.log(`Flat shading: ${enabled}`)
        })
    }

    /**
     * Sets up glossy texture toggle
     */
    private setupGlossyTextureToggle(): void {
        const glossyTextureToggle = document.getElementById('glossyTextureToggle')
        if (!(glossyTextureToggle instanceof HTMLInputElement)) {
            console.warn('Glossy texture toggle not found')
            return
        }

        glossyTextureToggle.addEventListener('change', (event) => {
            const target = event.target
            if (!(target instanceof HTMLInputElement)) return

            const enabled = target.checked

            // Apply to all meshes
            this.meshManager.getMeshes().forEach(dentalMesh => {
                const material = dentalMesh.mesh.material as THREE.MeshStandardMaterial
                if (enabled) {
                    material.roughness = 0.2  // Glossy
                    material.metalness = 0.1
                } else {
                    material.roughness = 0.4  // Matte
                    material.metalness = 0.0
                }
                material.needsUpdate = true
            })

            console.log(`Glossy texture: ${enabled}`)
        })
    }
}