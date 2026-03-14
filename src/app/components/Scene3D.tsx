"use client"

import { Canvas } from "@react-three/fiber"
import { useGLTF, OrbitControls, Environment } from "@react-three/drei"

function Model() {
  const { scene } = useGLTF("/models/model.glb")

  return (
    <primitive
      object={scene}
      scale={2}
      position={[0, -1, 0]}
    />
  )
}

export default function Scene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={1} />
      <Environment preset="city" />
      <Model />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2}/>
    </Canvas>
  )
}