import * as THREE from 'three'

export interface SelectedPoint {
    position: THREE.Vector3
    marker: THREE.Mesh
}

export class PointSelector {
    private scene: THREE.Scene
    private camera: THREE.Camera
    private domElement: HTMLElement
    private points: SelectedPoint[] = []
    private markerColor: number

    constructor(
        scene: THREE.Scene,
        camera: THREE.Camera,
        domElement: HTMLElement,
        markerColor: number = 0xff0000
    ) {
        this.scene = scene
        this.camera = camera
        this.domElement = domElement
        this.markerColor = markerColor
    }

    public selectPoint(event: MouseEvent, meshes: THREE.Mesh[]):THREE.Vector3 | null {
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        // Calculate mouse position in normalized device coordinates
        const rect = this.domElement.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, this.camera)
        const intersects = raycaster.intersectObjects(meshes, false)

        if (intersects.length > 0) {
            return intersects[0].point.clone()
        }

        return null
    }

    public addPoint(position: THREE.Vector3, markerSize: number = 0.5): SelectedPoint {
        // Create marker sphere
        const geometry = new THREE.SphereGeometry(markerSize, 16, 16)
        const material = new THREE.MeshBasicMaterial({ color: this.markerColor })
        const marker = new THREE.Mesh(geometry, material)
        marker.position.copy(position)
        this.scene.add(marker)

        const point: SelectedPoint = { position: position.clone(), marker }
        this.points.push(point)

        return point
    }

    public getPoints(): SelectedPoint[] {
        return this.points
    }

    public getPointCount(): number {
        return this.points.length
    }

    public clearPoints(): void {
        this.points.forEach(point => {
            this.scene.remove(point.marker)
            point.marker.geometry.dispose()
            ;(point.marker.material as THREE.Material).dispose()
        })
        this.points = []
    }

    public removeLastPoint(): void {
        const point = this.points.pop()
        if (point) {
            this.scene.remove(point.marker)
            point.marker.geometry.dispose()
            ;(point.marker.material as THREE.Material).dispose()
        }
    }

}