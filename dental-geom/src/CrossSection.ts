import * as THREE from 'three'
import { PointSelector } from './PointSelect'

export class CrossSection {
    private mainScene: THREE.Scene
    private camera: THREE.Camera
    private domElement: HTMLElement
    private plane: THREE.Plane
    private planeHelper: THREE.PlaneHelper
    private enabled: boolean = false
    private settingMode: boolean = false
    private pointSelector: PointSelector

    // PIP viewport
    private pipRenderer: THREE.WebGLRenderer
    private pipCamera: THREE.OrthographicCamera
    private pipScene: THREE.Scene
    private pipContainer: HTMLDivElement

    constructor(scene: THREE.Scene, camera: THREE.Camera, domElement: HTMLElement) {
        this.mainScene = scene
        this.camera = camera
        this.domElement = domElement

        // Create clipping plane
        this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

        // Create visual helper for the plane (in main scene)
        this.planeHelper = new THREE.PlaneHelper(this.plane, 100, 0x00ff00)
        this.planeHelper.visible = false
        this.mainScene.add(this.planeHelper)

        // Initialize point selector
        this.pointSelector = new PointSelector(scene, camera, domElement, 0x00ff00)

        // Setup cross-section scene
        this.pipScene = new THREE.Scene()
        this.pipScene.background = new THREE.Color(0x1a1a1a)

        // Setup orthographic camera for 2D view
        this.pipCamera = new THREE.OrthographicCamera(-50, 50, 50, -50, 0.1, 1000)
        this.pipCamera.position.z = 100

        // Create PIP viewport (must be last, uses this.pipCamera)
        this.pipContainer = this.createPIPViewport()
        this.pipRenderer = new THREE.WebGLRenderer({
            canvas: this.pipContainer.querySelector('canvas')!,
            antialias: true
        })
        this.pipRenderer.setSize(400, 400)
        this.pipRenderer.setPixelRatio(window.devicePixelRatio)
    }

    private createPIPViewport(): HTMLDivElement {
        // Create container
        const container = document.createElement('div')
        container.className = 'pip-viewport'
        container.style.display = 'none'
        document.body.appendChild(container)

        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 400
        container.appendChild(canvas)

        // Create label
        const label = document.createElement('div')
        label.className = 'pip-label'
        label.textContent = 'Cross-Section View'
        container.appendChild(label)

        return container
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled
        this.planeHelper.visible = enabled
        this.pipContainer.style.display = enabled ? 'block' : 'none'

        if (!enabled) {
            this.pointSelector.clearPoints()
            this.settingMode = false
        }
    }

    public isEnabled(): boolean {
        return this.enabled
    }

    public setSettingMode(mode: boolean): void {
        this.settingMode = mode
        this.domElement.style.cursor = mode ? 'crosshair' : 'default'

        if (mode) {
            this.pointSelector.clearPoints()
        }
    }

    public isSettingMode(): boolean {
        return this.settingMode
    }

    public handleClick(event: MouseEvent, meshes: THREE.Mesh[]): void {
        if (!this.enabled || !this.settingMode) return

        const position = this.pointSelector.selectPoint(event, meshes)
        if (!position) return

        this.pointSelector.addPoint(position)

        if (this.pointSelector.getPointCount() === 2) {
            this.createPlaneFromPoints()
            this.settingMode = false
            this.domElement.style.cursor = 'default'
        }
    }

    private createPlaneFromPoints(): void {
        const points = this.pointSelector.getPoints()
        if (points.length !== 2) return

        const p1 = points[0].position
        const p2 = points[1].position

        const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
        const direction = new THREE.Vector3().subVectors(p2, p1).normalize()
        const cameraDirection = new THREE.Vector3()
        this.camera.getWorldDirection(cameraDirection)

        const normal = new THREE.Vector3().crossVectors(direction, cameraDirection).normalize()

        if (normal.length() < 0.1) {
            normal.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize()
        }

        this.plane.setFromNormalAndCoplanarPoint(normal, midpoint)
        this.planeHelper.updateMatrixWorld(true)

        console.log('Plane created from two points')
        console.log('Normal:', normal)
        console.log('Point on plane:', midpoint)
    }

    public setPosition(value: number): void {
        this.plane.constant = value
        this.planeHelper.updateMatrixWorld(true)
    }

    public setAxis(axis: 'x' | 'y' | 'z'): void {
        switch (axis) {
            case 'x':
                this.plane.normal.set(1, 0, 0)
                break
            case 'y':
                this.plane.normal.set(0, 1, 0)
                break
            case 'z':
                this.plane.normal.set(0, 0, 1)
                break
        }
        this.plane.constant = 0
        this.pointSelector.clearPoints()
        this.planeHelper.updateMatrixWorld(true)
    }

    public getPlane(): THREE.Plane {
        return this.plane
    }

    public getPointCount(): number {
        return this.pointSelector.getPointCount()
    }

    // Render the cross-section view
    public render(meshes: THREE.Mesh[]): void {
        if (!this.enabled) return

        // Clear PIP scene
        this.pipScene.clear()

        // Add lighting to PIP scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
        this.pipScene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
        directionalLight.position.set(5, 5, 5)
        this.pipScene.add(directionalLight)

        // Calculate bounding box for all intersection points
        const allPoints: THREE.Vector3[] = []

        // Create cross-section contours
        meshes.forEach(mesh => {
            mesh.updateMatrixWorld(true)
            const geometry = mesh.geometry as THREE.BufferGeometry
            const positions = geometry.attributes.position

            const points: THREE.Vector3[] = []

            // Find edges that intersect the plane
            for (let i = 0; i < positions.count; i += 3) {

                const v1 = new THREE.Vector3(
                    positions.getX(i),
                    positions.getY(i),
                    positions.getZ(i)
                )
                const v2 = new THREE.Vector3(
                    positions.getX(i+1),
                    positions.getY(i+1),
                    positions.getZ(i+1)
                )
                const v3 = new THREE.Vector3(
                    positions.getX(i+2),
                    positions.getY(i+2),
                    positions.getZ(i+2)
                )

                // Transform to world space
                v1.applyMatrix4(mesh.matrixWorld)
                v2.applyMatrix4(mesh.matrixWorld)
                v3.applyMatrix4(mesh.matrixWorld)

                // Check each edge for intersection with plane
                this.checkEdgeIntersection(v1, v2, points)
                this.checkEdgeIntersection(v2, v3, points)
                this.checkEdgeIntersection(v3, v1, points)
            }

            // Add to all points for bounding box calculation
            allPoints.push(...points)


            // Create line geometry from intersection points
            if (points.length > 1) {
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0x00ff00,
                    linewidth: 3
                })
                const line = new THREE.LineSegments(lineGeometry, lineMaterial)
                this.pipScene.add(line)
            }
        })

        // Position and orient PIP camera to look directly at the cutting plane
        if (allPoints.length > 0) {
            // Calculate bounding box of intersection points
            const bbox = new THREE.Box3().setFromPoints(allPoints)
            const center = new THREE.Vector3()
            bbox.getCenter(center)
            const size = new THREE.Vector3()
            bbox.getSize(size)

            // Set orthographic camera size to fit the cross-section
            const maxDim = Math.max(size.x, size.y, size.z) * 1.2 // Add 20% padding
            this.pipCamera.left = -maxDim
            this.pipCamera.right = maxDim
            this.pipCamera.top = maxDim
            this.pipCamera.bottom = -maxDim
            this.pipCamera.updateProjectionMatrix()

            // Position camera perpendicular to the plane, looking at the center
            const cameraDistance = 1000
            this.pipCamera.position.copy(this.plane.normal).multiplyScalar(cameraDistance).add(center)
            this.pipCamera.lookAt(center)

            // Orient camera up vector
            // Use a consistent up direction based on the plane normal
            if (Math.abs(this.plane.normal.y) < 0.9) {
                this.pipCamera.up.set(1, 0, 0)
            } else {
                this.pipCamera.up.set(1, 0, 0)
            }
        }

        // Add plane visualization (semi-transparent background)
        const planeSize = 200
        const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize)
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.05,
            side: THREE.DoubleSide
        })
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)

        // Orient plane mesh to match the cutting plane
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            this.plane.normal.clone().normalize()
        )
        planeMesh.quaternion.copy(quaternion)
        planeMesh.position.copy(this.plane.normal).multiplyScalar(-this.plane.constant)

        this.pipScene.add(planeMesh)

        // Render PIP view
        this.pipRenderer.render(this.pipScene, this.pipCamera)
    }

    private checkEdgeIntersection(v1: THREE.Vector3, v2: THREE.Vector3, points: THREE.Vector3[]): void {
        const d1 = this.plane.distanceToPoint(v1)
        const d2 = this.plane.distanceToPoint(v2)

        // Edge crosses plane if distances have opposite signs
        if (d1 * d2 < 0) {
            const t = Math.abs(d1) / (Math.abs(d1) + Math.abs(d2))
            const intersection = new THREE.Vector3().lerpVectors(v1, v2, t)
            points.push(intersection)
        }
    }

    public dispose(): void {
        this.pointSelector.clearPoints()
        this.mainScene.remove(this.planeHelper)
        this.planeHelper.geometry.dispose()
        ;(this.planeHelper.material as THREE.Material).dispose()

        if (this.pipContainer.parentElement) {
            this.pipContainer.parentElement.removeChild(this.pipContainer)
        }

        this.pipRenderer.dispose()
    }
}