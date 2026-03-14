import Header from "@/components/Header"
import Scene3D from "@/components/Scene3D"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6efe5] to-[#e8e0d5] text-gray-800 overflow-hidden">

      <Header />

      <section className="h-screen flex items-center max-w-7xl mx-auto px-10 relative">

        {/* LADO IZQUIERDO */}

        <div className="flex-1 z-10">

          <h1 className="text-6xl font-semibold tracking-tight text-gray-900">
            Sala de espera
          </h1>

          <p className="mt-5 text-gray-600 max-w-lg text-lg">
            Por favor seleccione a dónde quiere dirigirse.
          </p>

          <div className="mt-12 flex gap-6">

            <a
              href="https://www.blackwood-alliance.com/"
              className="px-7 py-3 rounded-xl bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              Landing
            </a>

            <a
              href="/login"
              className="px-7 py-3 rounded-xl bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              Login
            </a>

            <a
              href="/app"
              className="px-7 py-3 rounded-xl bg-black text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              App
            </a>

          </div>

        </div>


        {/* LADO DERECHO */}

        <div className="flex-1 h-[650px] relative flex items-center justify-center">

          {/* halo de luz detrás del modelo */}

          <div className="absolute w-[600px] h-[600px] bg-orange-200 rounded-full blur-3xl opacity-40"></div>

          {/* escena 3D */}

          <div className="relative w-full h-full">
            <Scene3D />
          </div>

        </div>

      </section>

    </main>
  )
}