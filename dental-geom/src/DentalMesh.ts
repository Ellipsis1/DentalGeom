import * as THREE from 'three'

export class DentalMesh {
    public mesh: THREE.Mesh
    public filename: string
    public color: number
    public opacity: number
    public id: string
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

        //create material
        const material = new THREE.MeshPhongMaterial({
            color: color,
            flatShading: false,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0,
        })

        //create mesh
        this.mesh = new THREE.Mesh(geometry, material)

        //compute normals
        geometry.computeVertexNormals()
    }

    public setOpacity(value: number): void {
        this.opacity = value
        const material = this.mesh.material as THREE.MeshPhongMaterial
        material.opacity = value
    }

    public getVertexCount(): number {
        const geometry = this.mesh.geometry as THREE.BufferGeometry
        return geometry.attributes.position.count
    }

    public getTriangleCount():number {
        return this.getVertexCount() / 3
    }

    public setVisible(visible: boolean): void {
        this.mesh.visible = visible
    }

    public dispose(): void {
        this.mesh.geometry.dispose()
        const material = this.mesh.material as THREE.MeshPhongMaterial
        material.dispose()
    }

    public getColorHex(): string {
        return `#${this.color.toString(16).padStart(6,'0')}`
    }

    public createControlElement(
        onOpacityChange: (value: number) => void,
        onRemove: () => void
    ): HTMLElement {
        const controlDiv = document.createElement('div')
        controlDiv.className = 'mesh-control'
        controlDiv.id = this.id

        controlDiv.innerHTML =
            `
            <div class ="mesh-header">
                <span class="mesh-name" title="${this.filename}">${this.filename}</span>
                <button class="remove-btn">x</button>
            </div>
            <div class="mesh-slider">
                <label>
                    Opacity: <span class="opacity-value">100%</span>
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
        //add event listeners
        const slider = controlDiv.querySelector('.mesh-opacity-slider') as HTMLInputElement
        const opacityLabel = controlDiv.querySelector('.opacity-value') as HTMLSpanElement
        const removeBtn = controlDiv.querySelector('.remove-btn') as HTMLButtonElement

        slider.addEventListener('input', (event) => {
            const value = parseInt((event.target as HTMLInputElement).value)
            this.setOpacity(value / 100)
            opacityLabel.textContent = `${value}%`
            onOpacityChange(value)
        })

        removeBtn.addEventListener('click', () => {
            onRemove()
        })

        this.controlElement = controlDiv
        return controlDiv
    }

    public updateControlOpacity(): void {
        if (!this.controlElement) return

        const slider = this.controlElement.querySelector('.mesh-opacity-slider') as HTMLInputElement
        const opacityLabel = this.controlElement.querySelector('.opacity-value') as HTMLSpanElement
        const opacityPercent = Math.round(this.opacity * 100)

        if (slider) slider.value = opacityPercent.toString()
        if (opacityLabel) opacityLabel.textContent = `${opacityPercent}%`
    }

}