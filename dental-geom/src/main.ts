import './style.css'
import * as THREE from 'three'
import {OrbitControls} from "three-stdlib";
import {STLLoader} from "three-stdlib";

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
camera.position.set(0,-50,0)

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

//Array to story loaded meshes
const meshes: THREE.Mesh[] = []


//STL Loader
const loader = new STLLoader()

function loadSTL(file: File) {
    const reader = new FileReader()

    reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer
        const geometry = loader.parse(arrayBuffer)

        //scale the geometry
        geometry.computeBoundingBox()
        const boundingBox = geometry.boundingBox!

        //Calculate scale to fit in view
        const size = new THREE.Vector3()
        boundingBox.getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 30/maxDim
        geometry.scale(scale, scale, scale)

        //Compute normals for proper lighting
        geometry.computeVertexNormals()

        //Create material with transparency enabled
        const material = new THREE.MeshPhongMaterial({
            color: 0x808080,
            flatShading: false,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0,
        })

        //Create mesh
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)
        meshes.push(mesh)

        //update stats
        updateStats()

        console.log('STL loaded successfully')
        console.log('Total meshes:', meshes.length)
        console.log('Vertices:', geometry.attributes.position.count)
        console.log('Triangles:', geometry.attributes.position.count / 3)

    }

    reader.readAsArrayBuffer(file)
}

function updateStats() {
    let totalVertices = 0
    let totalTriangles = 0

    meshes.forEach(mesh =>{
        const geometry = mesh.geometry as THREE.BufferGeometry
        totalVertices += geometry.attributes.position.count
        totalTriangles += geometry.attributes.position.count / 3
    })

    const statsDiv = document.getElementById('stats')!
    statsDiv.innerHTML = `
    <strong>Mesh Statistics:</strong><br>
    Loaded Meshes: ${meshes.length}<br>
    Total Vertices: ${totalVertices.toLocaleString()}<br>
    Total Triangles: ${Math.floor(totalTriangles).toLocaleString()}
  `
}

function updateOpacity(value: number) {
    meshes.forEach(mesh => {
        if (mesh.material){
            const material = mesh.material as THREE.MeshPhongMaterial
            material.opacity = value / 100
        }
    })
    //update label
    const label = document.getElementById('opacityValue')!
    label.textContent = `${value}%`
}

function clearAllMeshes() {
    //remove all meshes from scene and dispose of their resources
    meshes.forEach(mesh => {
        scene.remove(mesh)
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m=> m.dispose())
        } else {
            mesh.material.dispose()
        }
    })

    meshes.length = 0

    //reset opacity slider
    const opacitySlider = document.getElementById('opacitySlider') as HTMLInputElement
    opacitySlider.value = '100'
    const label = document.getElementById('opacityValue')!
    label.textContent = '100%'

    //update stats
    updateStats()

    console.log('All meshes cleared')
}

//file input handler
const fileInput = document.getElementById('fileInput') as HTMLInputElement
fileInput.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file && file.name.endsWith('.stl')) {
        loadSTL(file)
    } else {
        alert('Please select an STL file')
    }
    //reset the input
    fileInput.value = ''
})

//Opacity slider handler
const opacitySlider = document.getElementById('opacitySlider') as HTMLInputElement
opacitySlider.addEventListener('input', (event) => {
    const value = parseInt((event.target as HTMLInputElement).value)
    updateOpacity(value)
})

//clear button handler
const clearBtn = document.getElementById('clearBtn')
clearBtn?.addEventListener('click', clearAllMeshes)

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

