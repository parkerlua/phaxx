import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

const BG_COLOR = 0x101010

const displacementShader = {
  uniforms: {
    tDiffuse: { value: null },
    displacement: { value: null },
    scale: { value: 0.025 },
    tileFactor: { value: 2 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D displacement;
    uniform float scale;
    uniform float tileFactor;
    varying vec2 vUv;
    void main() {
      if (vUv.x < 0.75 && vUv.x > 0.25 && vUv.y < 0.75 && vUv.y > 0.25) {
        vec2 tiledUv = mod(vUv * tileFactor, 1.0);
        vec2 disp = texture2D(displacement, tiledUv).rg * scale;
        vec2 distUv = vUv + disp;
        gl_FragColor = texture2D(tDiffuse, distUv);
      } else {
        gl_FragColor = texture2D(tDiffuse, vUv);
      }
    }
  `,
}

function buildMonochromeEnvMap(renderer) {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 512
  const ctx = c.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.5, '#888888')
  grad.addColorStop(1, '#1a1a1a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 4, 512)
  const raw = new THREE.CanvasTexture(c)
  raw.mapping = THREE.EquirectangularReflectionMapping
  raw.colorSpace = THREE.SRGBColorSpace
  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const rt = pmrem.fromEquirectangular(raw)
  raw.dispose()
  pmrem.dispose()
  return rt.texture
}

export default function Background() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    let disposed = false
    let frameId

    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    container.appendChild(canvas)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setClearColor(BG_COLOR)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )
    camera.position.set(0, 0, 10)

    const envMap = buildMonochromeEnvMap(renderer)
    scene.environment = envMap
    scene.fog = new THREE.FogExp2(BG_COLOR, 0.4)

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
    keyLight.position.set(3, 4, 5)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2)
    fillLight.position.set(-4, -1, 2)
    scene.add(fillLight)

    const surfaceImperfection = new THREE.TextureLoader().load(
      'https://miroleon.github.io/daily-assets/surf_imp_02.jpg',
    )
    surfaceImperfection.wrapT = THREE.RepeatWrapping
    surfaceImperfection.wrapS = THREE.RepeatWrapping

    const handsMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.2,
      roughnessMap: surfaceImperfection,
      envMap,
      envMapIntensity: 1.0,
    })

    const fbxloader = new FBXLoader()
    fbxloader.load(
      'https://miroleon.github.io/daily-assets/two_hands_01.fbx',
      (object) => {
        if (disposed) return
        object.traverse((child) => {
          if (child.isMesh) child.material = handsMat
        })
        object.position.set(0, 0, 0)
        object.scale.setScalar(0.05)
        scene.add(object)
      },
    )

    const renderScene = new RenderPass(scene, camera)

    const afterimagePass = new AfterimagePass()
    afterimagePass.uniforms['damp'].value = 0.9

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.9,
      0.5,
      0.85,
    )
    bloomPass.threshold = 0.2
    bloomPass.strength = 0.9
    bloomPass.radius = 0.8

    const displacementTexture = new THREE.TextureLoader().load(
      'https://raw.githubusercontent.com/miroleon/displacement_texture_freebie/main/assets/1K/jpeg/normal/ml-dpt-21-1K_normal.jpeg',
      (texture) => {
        texture.minFilter = THREE.NearestFilter
      },
    )

    const displacementPass = new ShaderPass(displacementShader)
    displacementPass.uniforms['displacement'].value = displacementTexture

    const composer = new EffectComposer(renderer)
    composer.addPass(renderScene)
    composer.addPass(afterimagePass)
    composer.addPass(bloomPass)
    composer.addPass(displacementPass)

    let theta = 0
    const update = () => {
      theta += 0.005
      camera.position.set(
        Math.sin(theta) * 3,
        Math.sin(theta),
        Math.cos(theta) * 3,
      )
      camera.lookAt(scene.position)
    }

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    const animate = () => {
      if (disposed) return
      frameId = requestAnimationFrame(animate)
      update()
      composer.render()
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      handsMat.dispose()
      surfaceImperfection.dispose()
      displacementTexture.dispose()
      envMap.dispose()
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -2,
        pointerEvents: 'none',
      }}
    />
  )
}
