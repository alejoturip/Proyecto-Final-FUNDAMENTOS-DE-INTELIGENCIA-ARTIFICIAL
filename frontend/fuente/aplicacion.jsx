/**
 * aplicacion.jsx
 * --------------
 * Toda la interfaz vive en este archivo. Es intencional: la aplicación tiene
 * una sola pantalla y tres estados (vacío, analizando, resultado). Partirla en
 * una carpeta de componentes agregaría archivos sin agregar claridad.
 *
 * Lo único importante de entender aquí es cómo se habla con FastAPI:
 * ver la función `analizar`.
 */
import { useState } from "react";
import {
  ImageUp,
  Loader2,
  RotateCcw,
  ScanLine,
  TriangleAlert,
  Globe,
  HeartPulse,
  Weight,
  Ruler,
  Zap,
} from "lucide-react";

// La URL del backend NUNCA se escribe fija en el código: cambia entre
// localhost y Render. Vite reemplaza esta variable en tiempo de compilación.
const URL_API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Los iconos de la ficha, emparejados con las claves de razas.json.
const CAMPOS_FICHA = [
  { clave: "pais_origen", etiqueta: "Origen", Icono: Globe },
  { clave: "esperanza_vida", etiqueta: "Esperanza de vida", Icono: HeartPulse },
  { clave: "peso_promedio", etiqueta: "Peso promedio", Icono: Weight },
  { clave: "tamano", etiqueta: "Tamaño", Icono: Ruler },
  { clave: "nivel_energia", etiqueta: "Energía", Icono: Zap },
];

export default function Aplicacion() {
  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);

  function seleccionarArchivo(nuevoArchivo) {
    if (!nuevoArchivo) return;

    setArchivo(nuevoArchivo);
    // createObjectURL genera una URL temporal en memoria para mostrar la foto
    // sin haberla subido todavía a ningún lado.
    setVistaPrevia(URL.createObjectURL(nuevoArchivo));
    setResultado(null);
    setError(null);
  }

  /**
   * Aquí ocurre la comunicación con el backend.
   *
   * Una imagen no se puede mandar como JSON. Se usa FormData, que produce una
   * petición multipart/form-data. La clave "imagen" debe coincidir EXACTAMENTE
   * con el nombre del parámetro en FastAPI:
   *
   *     async def predecir_raza(imagen: UploadFile = File(...))
   *
   * No se pone la cabecera Content-Type a mano: el navegador la escribe solo,
   * incluyendo el "boundary" que separa las partes. Ponerla rompe la petición.
   */
  async function analizar() {
    if (!archivo) return;

    setCargando(true);
    setError(null);

    const datos = new FormData();
    datos.append("imagen", archivo);

    try {
      const respuesta = await fetch(`${URL_API}/predecir`, {
        method: "POST",
        body: datos,
      });

      if (!respuesta.ok) {
        // FastAPI manda los errores como { "detail": "..." }
        const problema = await respuesta.json().catch(() => ({}));
        throw new Error(problema.detail || "El servidor rechazó la imagen.");
      }

      setResultado(await respuesta.json());
    } catch (fallo) {
      setError(
        fallo.message === "Failed to fetch"
          ? "No hay conexión con el servidor. Comprueba que el backend esté encendido."
          : fallo.message
      );
    } finally {
      // finally se ejecuta pase lo que pase: así el botón nunca queda girando.
      setCargando(false);
    }
  }

  function reiniciar() {
    setArchivo(null);
    setVistaPrevia(null);
    setResultado(null);
    setError(null);
  }

  return (
    <div className="min-h-screen px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {/* ---------------- Encabezado ---------------- */}
        <header className="mb-10 text-center">
          <p className="font-dato text-[11px] tracking-[0.2em] text-pino uppercase">
            Fundamentos de Inteligencia Artificial
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">
            Identificador de razas
          </h1>
          <p className="text-grafito mx-auto mt-3 max-w-md text-sm">
            Sube la foto de un perro y una red neuronal entrenada con 25 razas
            dirá cuál es y con qué seguridad lo afirma.
          </p>
        </header>

        {/* ---------------- Zona de carga ---------------- */}
        <section className="border-niebla bg-lienzo rounded-3xl border p-5 shadow-sm">
          {!vistaPrevia ? (
            <label
              onDragOver={(evento) => {
                evento.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(evento) => {
                evento.preventDefault();
                setArrastrando(false);
                seleccionarArchivo(evento.dataTransfer.files[0]);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 transition-colors duration-300 ${
                arrastrando
                  ? "border-pino bg-pino/5"
                  : "border-niebla hover:border-pino/50 hover:bg-papel/60"
              }`}
            >
              <ImageUp className="text-pino h-9 w-9" strokeWidth={1.5} />
              <span className="mt-4 text-sm font-medium">
                Arrastra una foto o haz clic para elegirla
              </span>
              <span className="text-grafito mt-1 text-xs">
                JPG, PNG o WEBP · hasta 5 MB
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(evento) => seleccionarArchivo(evento.target.files[0])}
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="bg-papel relative overflow-hidden rounded-2xl">
                <img
                  src={vistaPrevia}
                  alt="Vista previa del perro seleccionado"
                  className="h-72 w-full object-cover"
                />

                {/* Barrido de análisis: la línea recorre la foto mientras se espera
                    la respuesta del backend. */}
                {cargando && (
                  <div className="bg-tinta/25 absolute inset-0 overflow-hidden backdrop-blur-[1px]">
                    <div className="animate-barrido via-pino h-24 w-full bg-gradient-to-b from-transparent to-transparent opacity-70" />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={analizar}
                  disabled={cargando}
                  className="bg-pino focus-visible:ring-pino flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:opacity-60"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analizando
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-4 w-4" />
                      Analizar imagen
                    </>
                  )}
                </button>

                <button
                  onClick={reiniciar}
                  disabled={cargando}
                  aria-label="Elegir otra foto"
                  className="border-niebla hover:border-pino hover:text-pino rounded-xl border px-4 py-3.5 transition-colors disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ---------------- Error ---------------- */}
        {error && (
          <div className="animate-aparecer mt-5 flex items-start gap-3 rounded-2xl border border-ambar/40 bg-ambar/5 p-4">
            <TriangleAlert className="text-ambar mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ---------------- Resultado ---------------- */}
        {resultado && !cargando && (
          <section className="animate-aparecer mt-5 space-y-5">
            {/* Tarjeta principal: raza + confianza */}
            <div className="border-niebla bg-lienzo rounded-3xl border p-6 shadow-sm">
              <p className="font-dato text-grafito text-[11px] tracking-[0.2em] uppercase">
                Raza detectada
              </p>
              <h2 className="font-display mt-2 text-3xl font-bold">
                {resultado.raza}
              </h2>

              <div className="mt-5">
                <div className="flex items-end justify-between">
                  <span className="text-grafito text-xs">Confianza</span>
                  <span className="font-dato text-ambar text-2xl font-bold">
                    {resultado.confianza}%
                  </span>
                </div>
                <div className="bg-papel mt-2 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-ambar h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${resultado.confianza}%` }}
                  />
                </div>
              </div>

              {resultado.informacion?.descripcion && (
                <p className="text-grafito border-niebla mt-5 border-t pt-5 text-sm leading-relaxed">
                  {resultado.informacion.descripcion}
                </p>
              )}
            </div>

            {/* Ficha de la raza */}
            <div className="border-niebla bg-lienzo grid grid-cols-1 gap-px overflow-hidden rounded-3xl border shadow-sm sm:grid-cols-2">
              {CAMPOS_FICHA.map(({ clave, etiqueta, Icono }) => (
                <div key={clave} className="ring-niebla p-5 ring-1">
                  <div className="text-grafito flex items-center gap-2">
                    <Icono className="h-3.5 w-3.5" />
                    <span className="text-[11px] tracking-wide uppercase">
                      {etiqueta}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium">
                    {resultado.informacion?.[clave] ?? "—"}
                  </p>
                </div>
              ))}
            </div>

            {/* Top 3: las otras candidatas que evaluó el modelo */}
            <div className="border-niebla bg-lienzo rounded-3xl border p-6 shadow-sm">
              <p className="font-dato text-grafito text-[11px] tracking-[0.2em] uppercase">
                Top 3 de la red
              </p>
              <ul className="mt-4 space-y-3">
                {resultado.top.map((candidata, posicion) => (
                  <li key={candidata.clave} className="flex items-center gap-3">
                    <span className="font-dato text-grafito w-4 text-xs">
                      {posicion + 1}
                    </span>
                    <span className="flex-1 text-sm">{candidata.raza}</span>
                    <div className="bg-papel hidden h-1 w-28 overflow-hidden rounded-full sm:block">
                      <div
                        className={`h-full rounded-full ${
                          posicion === 0 ? "bg-pino" : "bg-niebla"
                        }`}
                        style={{ width: `${candidata.confianza}%` }}
                      />
                    </div>
                    <span className="font-dato w-16 text-right text-xs">
                      {candidata.confianza}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <footer className="text-grafito mt-12 text-center text-xs">
          MobileNetV2 · Transfer Learning · 25 razas
        </footer>
      </div>
    </div>
  );
}
