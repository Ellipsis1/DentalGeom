import * as THREE from 'three'

export class DentalMesh {
    public mesh: THREE.Mesh
    public filename: string
    public color: number
    public opacity: number
    public id: string
    public visible: boolean = true
    private controlElement: HTMLElement | null = null

    constructor(
        geometry: THREE.BufferGeometry,
        filename: string,
        color: number
    ) {
        this.filename = filename
        this.color = color
        this.opacity = 1.0
        this.id = `mesh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Create material
        const material = new THREE.MeshStandardMaterial({
            color: 0xf5e6d3,
            roughness: 0.4,
            metalness: 0.0,
            flatShading: false,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0,
        })

        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material)

        // Rotate mesh to face upward (dental scans are often oriented downward)
        this.mesh.rotation.x = Math.PI

        // Compute normals
        geometry.computeVertexNormals()
    }

    public setOpacity(value: number): void {
        this.opacity = value
        const material = this.mesh.material as THREE.MeshPhongMaterial
        material.opacity = value
    }

    public setVisible(visible: boolean): void {
        this.visible = visible
        this.mesh.visible = visible

        // Update checkbox if control element exists
        if (this.controlElement) {
            const checkbox = this.controlElement.querySelector('.mesh-checkbox') as HTMLInputElement
            if (checkbox) {
                checkbox.checked = visible
            }
        }
    }

    public dispose(): void {
        this.mesh.geometry.dispose()
        const material = this.mesh.material as THREE.MeshPhongMaterial
        material.dispose()
    }

    public getColorHex(): string {
        return `#${this.color.toString(16).padStart(6, '0')}`
    }

    public createControlElement(
        onOpacityChange: (value: number) => void,
        onVisibilityChange: (visible: boolean) => void,
        onRemove: () => void
    ): HTMLElement {
        const controlDiv = document.createElement('div')
        controlDiv.className = 'mesh-item'
        controlDiv.id = this.id

        // Set color bar
        controlDiv.style.borderLeftColor = this.getColorHex()

        controlDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                <input type="checkbox" class="mesh-checkbox" checked />
                <span class="mesh-name" title="${this.filename}">${this.filename}</span>
                <button class="mesh-remove-btn">×</button>
            </div>
            <div class="mesh-opacity">
                <label style="font-size: 11px; color: rgba(255, 255, 255, 0.7); margin-bottom: 4px; display: block;">
                    Opacity: <span class="opacity-percent">100%</span>
                </label>
                <input
                    type="range"
                    class="mesh-opacity-slider"
                    min="0"
                    max="100"
                    value="100"
                    step="1"
                />
            </div>
        `

        // Add event listeners
        const checkbox = controlDiv.querySelector('.mesh-checkbox') as HTMLInputElement
        const removeBtn = controlDiv.querySelector('.mesh-remove-btn') as HTMLButtonElement
        const slider = controlDiv.querySelector('.mesh-opacity-slider') as HTMLInputElement
        const opacityLabel = controlDiv.querySelector('.opacity-percent') as HTMLSpanElement

        // Checkbox visibility toggle - acts like individual Hide/Show button
        checkbox.addEventListener('change', (event) => {
            const isChecked = (event.target as HTMLInputElement).checked

            // Update mesh visibility based on checkbox state
            this.mesh.visible = isChecked
            this.visible = isChecked

            onVisibilityChange(isChecked)
        })

        // Opacity slider
        slider.addEventListener('input', (event) => {
            const value = parseInt((event.target as HTMLInputElement).value)
            this.setOpacity(value / 100)
            opacityLabel.textContent = `${value}%`
            onOpacityChange(value)
        })

        // Remove button - actually delete the mesh
        removeBtn.addEventListener('click', (event) => {
            event.stopPropagation()
            event.preventDefault()
            onRemove()
        })

        this.controlElement = controlDiv
        return controlDiv
    }

    public updateControlOpacity(): void {
        if (!this.controlElement) return

        const slider = this.controlElement.querySelector('.mesh-opacity-slider') as HTMLInputElement
        const opacityLabel = this.controlElement.querySelector('.opacity-percent') as HTMLSpanElement
        const opacityPercent = Math.round(this.opacity * 100)

        if (slider) slider.value = opacityPercent.toString()
        if (opacityLabel) opacityLabel.textContent = `${opacityPercent}%`
    }
}