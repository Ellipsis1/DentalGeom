import * as THREE from 'three'
import { PointSelector }  from "./PointSelect";

export interface MeasurementPoint {
    position: THREE.Vector3
    marker: THREE.Mesh
}

export class MeasurementTool {
    private scene: THREE.Scene
    private camera: THREE.Camera
    private domElement: HTMLElement
    private enabled: boolean = false
    private pointSelector: PointSelector
    private line: THREE.Line | null = null
    private label: HTMLDivElement | null = null

    constructor(scene: THREE.Scene, camera: THREE.Camera,domElement: HTMLElement) {
        this.scene = scene
        this.camera = camera
        this.domElement = domElement

        //initialize point select with markers
        this.pointSelector = new PointSelector(scene, camera, domElement, 0xff0000)

        this.createLabel()
    }

    private createLabel(): void {
        this.label = document.createElement("div")
        this.label.className = 'measurement-label'
        this.label.style.display = 'none'
        document.body.appendChild(this.label)
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled
        this.domElement.style.cursor = enabled ? 'crosshair' : 'default'

        if (!enabled) {
            this.clear()
        }
    }

    public isEnabled(): boolean {
        return this.enabled
    }

    public handleClick(event: MouseEvent, meshes: THREE.Mesh[]): void {
        if (!this.enabled) return

        const position = this.pointSelector.selectPoint(event, meshes)
        if (!position)  return

        this.pointSelector.addPoint(position)

        if (this.pointSelector.getPointCount() === 2) {
            this.createMeasurement()
        } else if (this.pointSelector.getPointCount() > 2) {
            //reset after 2 points
            this.clear()
            this.pointSelector.addPoint(position)
        }
    }

    private createMeasurement(): void {
        const points = this.pointSelector.getPoints()
        if (points.length !== 2) return

        const p1 = points[0].position
        const p2 = points[1].position

        //create line between points
        const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2])
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 , linewidth: 2 })
        this.line = new THREE.Line(geometry, material)
        this.scene.add(this.line)

        //calc distance
        const distance = p1.distanceTo(p2)

        //show label
        this.updateLabel(distance, p1, p2)
    }

    private updateLabel(distance: number, p1: THREE.Vector3, p2: THREE.Vector3): void {
        if (!this.label) return

        //calc midpoint
        const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)

        //project to screen coordinates
        const screenPos = midpoint.clone().project(this.camera)
        const x = (screenPos.x * 0.5 + 0.5 ) * window.innerWidth
        const y = (screenPos.y * -0.5 + 0.5 ) * window.innerHeight

        this.label.style.display = 'block'
        this.label.style.left = `${x}px`
        this.label.style.top = `${y}px`
        this.label.textContent = `${distance.toFixed(2)} mm`
    }

    public clear(): void {
        //clear points
        this.pointSelector.clearPoints()

        //clear line
        if (this.line) {
            this.scene.remove(this.line)
            this.line.geometry.dispose()
            ;(this.line.material as THREE.Material).dispose()
            this.line = null
        }

        //hide label
        if (this.label) {
            this.label.style.display = 'none'
        }
    }

    public dispose(): void {
        this.clear()
        if (this.label && this.label.parentElement) {
            this.label.parentElement.removeChild(this.label)
        }
    }

}