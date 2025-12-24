import './style.css'
import * as THREE from 'three'
import { OrbitControls } from "three-stdlib";
import { MeshManager } from "./MeshManager";
// import { CrossSectionTool } from "./CrossSectionTool";
// import { CrossSectionView } from "./CrossSectionView";
// import { MeasurementTool } from "./MeasurementTool";

//Scene setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x4a4a7a)

const cameraAspect = window.innerWidth / window.innerHeight
const frustumSize = 100
//Camera
const camera = new THREE.OrthographicCamera(
    frustumSize * cameraAspect / -2,
    frustumSize * cameraAspect / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    1000
)

camera.position.set(20, 20, 20)
camera.lookAt(0, 0, -1)

//Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.localClippingEnabled = true
document.body.appendChild(renderer.domElement)

//Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.target.set(0,0,0)
controls.update()

// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

// Key light
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
keyLight.position.set(50, 100, 50)
keyLight.castShadow = false
scene.add(keyLight)

// Fill light
const fillLight = new THREE.DirectionalLight(0xffffff, 0.6)
fillLight.position.set(-50, 50, -50)
scene.add(fillLight)

// Rim light
const rimLight = new THREE.DirectionalLight(0xffffff, 0.7)
rimLight.position.set(0, 50, -100)
scene.add(rimLight)

// Hemisphere light
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5)
scene.add(hemiLight)

//Mesh Manager
const meshListElement = document.getElementById('meshList')!
const meshManager = new MeshManager(scene, meshListElement)

// //CrossSection Tool
// const crossSectionTool = new CrossSectionTool(
//     scene,
//     renderer,
//     camera,
//     renderer.domElement
// )
//
// //Measurement Tool
// const measurementTool = new MeasurementTool(scene, camera, renderer.domElement)

// Camera centering function
function centerCameraOnMeshes(): void {
    const boundingBox = meshManager.getBoundingBox()
    if (boundingBox.isEmpty()) return

    // Get center and size of bounding box
    const center = new THREE.Vector3()
    boundingBox.getCenter(center)

    const size = new THREE.Vector3()
    boundingBox.getSize(size)

    // Calculate the distance needed to fit the object in view
    const maxDim = Math.max(size.x, size.y, size.z)
    let cameraDistance = Math.abs(maxDim)

    // Set to front view (looking from above) as default
    camera.position.set(center.x, center.y + cameraDistance, center.z)
    camera.up.set(0, 0, -1)
    camera.lookAt(center)

    controls.target.copy(center)
    controls.update()

    console.log('Camera set to front view (default)')
}

// Set callback to center camera when mesh is loaded
meshManager.setOnMeshLoaded(() => {
    centerCameraOnMeshes()
})

// ============ View Navigation (6-button grid) ============
const viewButtons = document.querySelectorAll('.dir-btn')
viewButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
        const target = event.currentTarget as HTMLElement
        const view = target.getAttribute('data-view')
        if (view) {
            setCameraView(view)
        }
    })
})

function setCameraView(view: string): void {
    const bbox = meshManager.getBoundingBox()
    if (bbox.isEmpty()) {
        console.warn('No meshes loaded')
        return
    }

    const center = new THREE.Vector3()
    bbox.getCenter(center)

    const size = new THREE.Vector3()
    bbox.getSize(size)
    const distance = Math.max(size.x, size.y, size.z)

    let targetPosition = new THREE.Vector3()
    let targetUp = new THREE.Vector3()

    switch (view) {
        case 'top':
            // Looking down from above (Z+)
            targetPosition.set(center.x, center.y, center.z + distance)
            targetUp.set(0, 1, 0)
            break
        case 'bottom':
            // Looking up from below (Z-)
            targetPosition.set(center.x, center.y, center.z - distance)
            targetUp.set(0, 1, 0)
            break
        case 'front':
            // Looking from front (Y+)
            targetPosition.set(center.x, center.y + distance, center.z)
            targetUp.set(0, 0, -1)
            break
        case 'back':
            // Looking from back (Y-)
            targetPosition.set(center.x, center.y - distance, center.z)
            targetUp.set(0, 0, -1)
            break
        case 'left':
            // Looking from left side (X+) - swapped
            targetPosition.set(center.x + distance, center.y, center.z)
            targetUp.set(0, 0, -1)
            break
        case 'right':
            // Looking from right side (X-) - swapped
            targetPosition.set(center.x - distance, center.y, center.z)
            targetUp.set(0, 0, -1)
            break
    }

    const startPosition = camera.position.clone()
    const startUp = camera.up.clone()
    const startTarget = controls.target.clone()

    let progress = 0
    const duration = 1000 // milliseconds
    const startTime = Date.now()

    function animateMovement() {
        const elapsedTime = Date.now() - startTime
        progress = Math.min(elapsedTime / duration, 1)

        const easein_out = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress +2,2) /2

        // Lerp position
        camera.position.lerpVectors(startPosition, targetPosition, easein_out)
        camera.up.lerpVectors(startUp, targetUp, easein_out)
        controls.target.lerpVectors(startTarget, center, easein_out)

        camera.lookAt(controls.target)
        controls.update()

        if (progress < 1) {
            requestAnimationFrame(animateMovement)
        }
    }

    animateMovement()
}

// ============ File Input ============
const fileInput = document.getElementById('fileInput') as HTMLInputElement
fileInput.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file && file.name.endsWith('.stl')) {
        try {
            await meshManager.loadSTL(file)
        } catch (error) {
            console.error('Error loading STL:', error)
            alert('Failed to load STL file.')
        }
    } else {
        alert('Please select an STL file')
    }
    fileInput.value = ''
})

// ============ Hide All Button ============
const hideAllBtn = document.getElementById('hideAllBtn')
let allHidden = false

hideAllBtn?.addEventListener('click', () => {
    const meshes = meshManager.getMeshes()
    allHidden = !allHidden

    meshes.forEach(mesh => {
        // Find the checkbox for this mesh and toggle it
        const meshElement = document.getElementById(mesh.id)
        if (meshElement) {
            const checkbox = meshElement.querySelector('.mesh-checkbox') as HTMLInputElement
            if (checkbox) {
                checkbox.checked = !allHidden
                // Manually set visibility without triggering event
                mesh.mesh.visible = !allHidden
                mesh.visible = !allHidden
            }
        }
    })

    // Update button text
    hideAllBtn.textContent = allHidden ? 'Show All' : 'Hide All'
})

// ============ Close Button ============
const closeBtn = document.getElementById('closeBtn')
closeBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to close DentalGeom?')) {
        window.close()
    }
})

// ============ Settings Button ============
const settingsBtn = document.getElementById('settingsBtn')
const settingsModal = document.getElementById('settingsModal')!
const settingsOverlay = document.getElementById('settingsOverlay')!
const settingsClose = document.getElementById('settingsClose')!

settingsBtn?.addEventListener('click', () => {
    settingsModal.style.display = 'block'
    settingsOverlay.style.display = 'block'
})

settingsClose.addEventListener('click', () => {
    settingsModal.style.display = 'none'
    settingsOverlay.style.display = 'none'
})

settingsOverlay.addEventListener('click', () => {
    settingsModal.style.display = 'none'
    settingsOverlay.style.display = 'none'
})

// ============ Mesh Section Collapse ============
const meshSectionHeader = document.getElementById('meshSectionHeader')
meshSectionHeader?.addEventListener('click', () => {
    meshSectionHeader.classList.toggle('collapsed')
    meshListElement.classList.toggle('collapsed')
})
// Flat Shading
const flatShadingToggle = document.getElementById('flatShadingToggle') as HTMLInputElement

flatShadingToggle.addEventListener('change', (event) => {
    const enabled = (event.target as HTMLInputElement).checked

    // Apply to all meshes
    meshManager.getMeshes().forEach(dentalMesh => {
        const material = dentalMesh.mesh.material as THREE.MeshStandardMaterial
        material.flatShading = enabled
        material.needsUpdate = true

        // Recompute normals
        const geometry = dentalMesh.mesh.geometry as THREE.BufferGeometry
        if (enabled) {
            geometry.computeVertexNormals()
        } else {
            geometry.computeVertexNormals()
        }
    })

    console.log(`Flat shading: ${enabled}`)
})

//Glossy Texture
const glossyTextureToggle = document.getElementById('glossyTextureToggle') as HTMLInputElement

glossyTextureToggle.addEventListener('change', (event) => {
    const enabled = (event.target as HTMLInputElement).checked

    // Apply to all meshes
    meshManager.getMeshes().forEach(dentalMesh => {
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

// ============ Animation Loop ============
function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
}

// ============ Window Resize ============
window.addEventListener('resize', () => {
    const distance = camera.position.distanceTo(controls.target)
    camera.left = -distance
    camera.right = distance
    camera.top = distance
    camera.bottom = -distance
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

animate()