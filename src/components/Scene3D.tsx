"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, useGLTF } from "@react-three/drei"

function Model() {
  const { scene } = useGLTF("/models/model.glb")

  return (
    <primitive
      object={scene}
      scale={0.018}        // MUY importante
      position={[0, -2, 0]}
    />
  )
}

export default function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 2, 20], fov: 50 }}   // cámara lejos
    >
      <ambientLight intensity={1} />
      <directionalLight position={[5,5,5]} />

      <Environment preset="city" />

      <Model />

<OrbitControls
  enableZoom={false}
  enablePan={false}
  enableRotate={false}
  autoRotate
  autoRotateSpeed={0.6}
/>
    </Canvas>
  )
}