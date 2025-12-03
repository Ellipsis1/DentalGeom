import * as THREE from 'three'
import { STLLoader} from "three-stdlib";
import { DentalMesh } from "./DentalMesh";

export class MeshManager {
    private meshes: DentalMesh[] = []
    private scene: THREE.Scene
    private loader: STLLoader
    private meshListElement: HTMLElement
    private statsElement: HTMLElement
    private onMeshLoadedCallback?: () => void

    //Color for all meshes - Grey
    private readonly defaultColor = 0x808080

    constructor(
        scene: THREE.Scene,
        meshListElement: HTMLElement,
        statsElement: HTMLElement
    ) {
        this.scene = scene
        this.meshListElement = meshListElement
        this.statsElement = statsElement
        this.loader = new STLLoader()
    }

    public setOnMeshLoaded(callback: () => void) {
        this.onMeshLoadedCallback = callback
    }

    public async loadSTL(file: File): Promise<void>{
        return new Promise((resolve, reject)=> {
            const reader = new FileReader()

            reader.onload = (event) => {
                try {
                    const arrayBuffer = event.target?.result as ArrayBuffer
                    const geometry = this.loader.parse(arrayBuffer)

                    //create mesh
                    const dentalMesh = new DentalMesh(geometry, file.name, this.defaultColor)

                    //add to scene
                    this.scene.add(dentalMesh.mesh)

                    //update ui
                    this.meshes.push(dentalMesh)
                    this.updateStats()
                    this.addMeshControl(dentalMesh)

                    //notify callback
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

    private addMeshControl (dentalMesh: DentalMesh): void {
        const controlElement = dentalMesh.createControlElement(
            (value) => {
                //opacity changed callback
                console.log(`${dentalMesh.filename} opacity: ${value}%`)
            },
            () => {
                //remove callback
                this.removeMesh(dentalMesh)
            }
        )

        this.meshListElement.appendChild(controlElement)
    }

    public removeMesh(dentalMesh: DentalMesh): void {
        const index = this.meshes.indexOf(dentalMesh)
        if (index === -1) return

        //remove mesh from scene
        this.scene.remove(dentalMesh.mesh)

        //dispose resources
        dentalMesh.dispose()

        //remove from mesh array
        this.meshes.splice(index, 1)

        //remove control element
        const controlElement = document.getElementById(dentalMesh.id)
        if (controlElement) {
            controlElement.remove()
        }

        //update stats
        this.updateStats()

        console.log('Mesh removed, total meshes:', this.meshes.length)
    }

    public clearAll(): void {
        //remove all meshes
        this.meshes.forEach(dentalMesh => {
            this.scene.remove(dentalMesh.mesh)
            dentalMesh.dispose()
        })

        //clear arrays and UI
        this.meshes = []
        this.meshListElement.innerHTML = ''

        //update stats
        this.updateStats()

        console.log('All meshes cleared.')
    }

    private updateStats(): void {
        let totalVertices= 0
        let totalTriangles = 0

        this.meshes.forEach(dentalMesh => {
            totalVertices += dentalMesh.getVertexCount()
            totalTriangles += dentalMesh.getTriangleCount()
        })

        this.statsElement.innerHTML = `
            <strong>Mesh Statistics:</strong><br>
            Loaded Meshes: ${this.meshes.length}<br>
            Total Vertices: ${totalVertices.toLocaleString()}<br>
            Total Triangles: ${Math.floor(totalTriangles).toLocaleString()}
        `
    }

    public getMeshes(): DentalMesh[] {
        return this.meshes
    }

    public getMeshCount(): number {
        return this.meshes.length
    }

    //calc bounding box for all meshes
    public getBoundingBox(): THREE.Box3 {
        const box = new THREE.Box3()
        this.meshes.forEach(dentalMesh => {
            const meshBox = new THREE.Box3().setFromObject(dentalMesh.mesh)
            box.union(meshBox)
        })
        return box
    }
}