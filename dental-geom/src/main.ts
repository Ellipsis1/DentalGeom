import './style.css'
import * as THREE from 'three'
import {OrbitControls} from "three-stdlib";
import {MeshManager} from "./MeshManager";
import { CrossSection } from "./CrossSection";
import { MeasurementTool } from "./MeasurementTool";

//Scene setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x2a2a2a)

//Camera
const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
)
camera.position.set(50,50,100)

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

//Lighting
const ambientLight = new THREE.AmbientLight(0xffffff,0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(10,10,10)
scene.add(directionalLight)

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight2.position.set(-10, -10, -10)
scene.add(directionalLight2)

//Grid Helper
const gridHelper = new THREE.GridHelper(200,20,0x444444,0x222222)
scene.add(gridHelper)

//Axes Helper
const axesHelper = new THREE.AxesHelper(20)
scene.add(axesHelper)

//Mesh Manager
const meshListElement = document.getElementById('meshList')!
const statsElement = document.getElementById('stats')!
const meshManager = new MeshManager(scene, meshListElement, statsElement)

//CrossSection Tool
const crossSection = new CrossSection(scene, camera, renderer.domElement)

//Measurement Tool
const measurementTool = new MeasurementTool(scene, camera, renderer.domElement)

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
    const fov = camera.fov * (Math.PI / 180)
    let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2))

    // Position camera
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)

    // Set camera position relative to center
    camera.position.copy(center).add(direction.multiplyScalar(-cameraDistance))

    camera.position.set(
        center.x + cameraDistance * 0.5,
        center.y - cameraDistance * 0.8,
        center.z + cameraDistance * 0.5
    )

    camera.lookAt(center)

    // Update controls target
    controls.target.copy(center)
    controls.update()
}

// Set callback to center camera when mesh is loaded
meshManager.setOnMeshLoaded(() => {
    centerCameraOnMeshes()
})

// Center Camera button
const centerCameraBtn = document.getElementById('centerCameraBtn')!
centerCameraBtn.addEventListener('click', () => {
    centerCameraOnMeshes()
})

//file input handler
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

    //reset the input
    fileInput.value = ''
})


//clear button handler
const clearBtn = document.getElementById('clearBtn')
clearBtn?.addEventListener('click', () => {
    meshManager.clearAll()
})


//Cross-Section Toggle
const crossSectionToggle = document.getElementById('crossSectionToggle') as HTMLInputElement
const crossSectionSlider = document.getElementById('crossSectionSlider') as HTMLInputElement
const crossSectionAxis = document.getElementById('crossSectionAxis') as HTMLSelectElement
const crossSectionValue = document.getElementById('crossSectionValue') as HTMLSpanElement
const setPlaneBtn = document.getElementById('setPlaneBtn') as HTMLButtonElement
const crossSectionStatus = document.getElementById('crossSectionStatus') as HTMLSpanElement

crossSectionToggle.addEventListener('change', (event) => {
    const enabled = (event.target as HTMLInputElement).checked
    crossSection.setEnabled(enabled)

    if (crossSection.isEnabled()) {
        const meshes = meshManager.getMeshes().map(dm => dm.mesh)
        crossSection.render(meshes)
    }

    //update ui
    setPlaneBtn.disabled = !enabled
    crossSectionSlider.disabled = !enabled
    crossSectionAxis.disabled = !enabled
})

crossSectionSlider.addEventListener('input', (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value)
    crossSection.setPosition(value)
    crossSectionValue.textContent = value.toFixed(1)

    if (crossSection.isEnabled()) {
        const meshes = meshManager.getMeshes().map(dm => dm.mesh)
        crossSection.render(meshes)
    }
})

crossSectionAxis.addEventListener('change', (event) => {
    const axis = (event.target as HTMLInputElement).value as 'x' | 'y' | 'z'
    crossSection.setAxis(axis)
    crossSectionSlider.value = '0'
    crossSectionValue.textContent = '0.0'

    if (crossSection.isEnabled()) {
        const meshes = meshManager.getMeshes().map(dm => dm.mesh)
        crossSection.render(meshes)
    }
})

setPlaneBtn.addEventListener('click', () => {
    crossSection.setSettingMode(true)
    controls.enabled = false
    crossSectionStatus.textContent = 'Click 2 points on mesh to set plane'
    crossSectionStatus.style.display = 'block'
})

//Measurement Tool toggle
const measurementToggle = document.getElementById('measurementToggle') as HTMLInputElement
const clearMeasurementBtn = document.getElementById('clearMeasurementBtn')!

measurementToggle.addEventListener('change', (event) => {
    const enabled = (event.target as HTMLInputElement).checked
    measurementTool.setEnabled(enabled)

    //Disable orbit controls when measuring
    controls.enabled = !enabled
})

clearMeasurementBtn.addEventListener('click', () => {
    measurementTool.clear()
})

//Click handler for measurements and cross-section
renderer.domElement.addEventListener('click', (event) => {
    const meshes = meshManager.getMeshes().map(dm => dm.mesh)

    if (crossSection.isSettingMode()) {
        const prevCount = crossSection.getPointCount()
        crossSection.handleClick(event, meshes)

        //update status
        const pointCount = crossSection.getPointCount()
        if (pointCount === 0) {
            crossSectionStatus.textContent = 'Click 2 points on mesh to set plane'
        } else if (pointCount === 1) {
            crossSectionStatus.textContent = 'Click 1 more point'
        } else if (pointCount === 2 && prevCount === 1) {
            crossSection.render(meshes)
            crossSectionStatus.style.display = 'none'
            controls.enabled = true
        }
    } else if (measurementTool.isEnabled()) {
        measurementTool.handleClick(event, meshes)
    }
})

// Animation loop
function animate() {
    requestAnimationFrame(animate)
    controls.update()

    renderer.render(scene,camera)
}
//handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})


animate()