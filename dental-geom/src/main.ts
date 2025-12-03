import './style.css'
import * as THREE from 'three'
import {OrbitControls} from "three-stdlib";
import {MeshManager} from "./MeshManager.ts";

//Scene setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x2a2a2a)

//Camera
const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0,-200,0)

//Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

//Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05

//Lighting
const ambientLight = new THREE.AmbientLight(0xffffff,0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(-10,-10,-10)
scene.add(directionalLight)

//Grid Helper
const gridHelper = new THREE.GridHelper(100,20,0x444444,0x222222)
scene.add(gridHelper)

//Axes Helper
const axesHelper = new THREE.AxesHelper(20)
scene.add(axesHelper)

//Mesh Manager
const meshListElement = document.getElementById('meshList')!
const statsElement = document.getElementById('stats')!
const meshManager = new MeshManager(scene, meshListElement, statsElement)

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