import * as THREE from 'three'
import { STLLoader } from "three-stdlib"
import { DentalMesh } from "./DentalMesh"
import { MESH_COLORS} from "./Constants.ts";

export class MeshManager {
    private meshes: DentalMesh[] = []
    private scene: THREE.Scene
    private loader: STLLoader
    private meshListElement: HTMLElement
    private onMeshLoadedCallback?: () => void
    private colorIndex: number = 0

    constructor(
        scene: THREE.Scene,
        meshListElement: HTMLElement,
    ) {
        this.scene = scene
        this.meshListElement = meshListElement
        this.loader = new STLLoader()
    }

    public setOnMeshLoaded(callback: () => void): void {
        this.onMeshLoadedCallback = callback
    }

    /**
     * Gets the next color in the rotation sequence
     */
    private getNextColor(): number {
        const color = MESH_COLORS[this.colorIndex]
        this.colorIndex = (this.colorIndex + 1) % MESH_COLORS.length
        return color
    }

    public async loadSTL(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (event) => {
                try {
                    const arrayBuffer = event.target?.result as ArrayBuffer
                    const geometry = this.loader.parse(arrayBuffer)

                    // Get next color from rotation
                    const color = this.getNextColor()

                    // Create mesh with assigned color
                    const dentalMesh = new DentalMesh(geometry, file.name, color)

                    // Add to scene
                    this.scene.add(dentalMesh.mesh)

                    // Update UI
                    this.meshes.push(dentalMesh)
                    this.addMeshControl(dentalMesh)

                    // Notify callback
                    if (this.onMeshLoadedCallback) {
                        this.onMeshLoadedCallback()
                    }

                    resolve()
                } catch (error) {
                    reject(error)
                }
            }

            reader.onerror = () => {
                reject(new Error('Failed to read file.'))
            }

            reader.readAsArrayBuffer(file)
        })
    }

    private addMeshControl(dentalMesh: DentalMesh): void {
        const controlElement = dentalMesh.createControlElement(
            (value) => {
                // Callback 1: opacity changed
                console.log(`${dentalMesh.filename} opacity: ${value}%`)
            },
            (visible) => {
                // Callback 2: visibility changed
                console.log(`${dentalMesh.filename} visibility: ${visible}`)
            },
            () => {
                // Callback 3: remove mesh
                console.log(`Removing ${dentalMesh.filename}`)
                this.removeMesh(dentalMesh)
            }
        )

        this.meshListElement.appendChild(controlElement)
    }

    public removeMesh(dentalMesh: DentalMesh): void {
        const index = this.meshes.indexOf(dentalMesh)
        if (index === -1) return

        // Remove mesh from scene
        this.scene.remove(dentalMesh.mesh)

        // Dispose resources
        dentalMesh.dispose()

        // Remove from mesh array
        this.meshes.splice(index, 1)

        // Remove control element
        const controlElement = document.getElementById(dentalMesh.id)
        if (controlElement) {
            controlElement.remove()
        }
    }

    public getMeshes(): DentalMesh[] {
        return this.meshes
    }

    /**
     * Calculates the combined bounding box of all loaded meshes
     * @returns A Box3 containing all meshes, or an empty Box3 if no meshes are loaded
     */
    public getBoundingBox(): THREE.Box3 {
        const box = new THREE.Box3()
        this.meshes.forEach(dentalMesh => {
            const meshBox = new THREE.Box3().setFromObject(dentalMesh.mesh)
            box.union(meshBox)
        })
        return box
    }

    /**
     * Sets visibility for all meshes and updates their UI controls
     * @param visible - Whether meshes should be visible
     */
    public setAllVisible(visible: boolean): void {
        this.meshes.forEach(mesh => {
            mesh.setVisible(visible)
        })
    }

    /**
     * Disposes all meshes and clears the manager
     * Used for cleanup when closing the application
     */
    public disposeAll(): void {
        // Work backwards to avoid index issues during removal
        for (let i = this.meshes.length - 1; i >= 0; i--) {
            this.removeMesh(this.meshes[i])
        }
    }

    /**
     * Resets the color rotation back to the first color
     */
    public resetColorRotation(): void {
        this.colorIndex = 0
    }
}