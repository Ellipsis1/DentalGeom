import * as THREE from 'three'
import { STLLoader} from "three-stdlib";
import { DentalMesh } from "./DentalMesh";

export class MeshManager {
    private meshes: DentalMesh[] = []
    private scene: THREE.Scene
    private loader: STLLoader
    private meshListElement: HTMLElement
    private onMeshLoadedCallback?: () => void

    constructor(
        scene: THREE.Scene,
        meshListElement: HTMLElement,
    ) {
        this.scene = scene
        this.meshListElement = meshListElement
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
                    const dentalMesh = new DentalMesh(geometry, file.name)

                    //add to scene
                    this.scene.add(dentalMesh.mesh)

                    //update ui
                    this.meshes.push(dentalMesh)
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
    }

    public getMeshes(): DentalMesh[] {
        return this.meshes
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