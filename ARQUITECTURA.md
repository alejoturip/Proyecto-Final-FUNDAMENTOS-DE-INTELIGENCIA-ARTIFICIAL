# Arquitectura del proyecto

> Documento de la **Fase 1**. Debe quedar aprobado antes de tocar el dataset.

---

## 1. Estructura de carpetas

```
detector-razas/
│
├── ARQUITECTURA.md          Este documento
├── README.md                Cómo levantar y desplegar el proyecto
│
├── backend/                 Todo lo que corre en Python (se despliega en Render)
│   ├── main.py              La API: rutas HTTP. Único archivo que sabe de HTTP
│   ├── prediccion.py        La IA en uso: carga el modelo, procesa, predice
│   ├── entrenamiento.py     Script que se ejecuta UNA vez en tu laptop
│   ├── razas.json           La "base de datos": ficha de las 25 razas
│   ├── requirements.txt     Dependencias de Python
│   │
│   ├── modelo/              Se llena al entrenar
│   │   ├── modelo_razas.keras   La red entrenada (~15 MB)
│   │   └── clases.json          El orden de las razas (índice 0, 1, 2...)
│   │
│   └── imagenes/            El dataset (NO se sube a Git)
│       ├── labrador_retriever/
│       ├── border_collie/
│       └── ... (25 carpetas x ~150 fotos)
│
└── frontend/                Todo lo que corre en el navegador (se despliega en Netlify)
    ├── index.html           La página que carga React
    ├── package.json         Dependencias de JavaScript
    ├── vite.config.js       Configuración de Vite
    ├── tailwind.config.js   Sistema de diseño: colores, fuentes, animaciones
    ├── postcss.config.js    Conecta Tailwind con Vite
    ├── .env.example         Plantilla de la URL del backend
    │
    └── fuente/
        ├── principal.jsx    Monta React en el HTML
        ├── aplicacion.jsx   TODA la interfaz
        └── estilos.css      Las 3 directivas de Tailwind
```

**Total: 6 carpetas.** Dos de ellas (`modelo/` e `imagenes/`) existen porque
guardan archivos binarios, no código.

### Por qué cada carpeta existe

| Carpeta | Por qué existe |
|---|---|
| `backend/` | Se despliega en un servidor distinto (Render) que el frontend. Son dos aplicaciones independientes. |
| `backend/modelo/` | Separa los artefactos generados por el entrenamiento del código fuente. Permite `.gitignore` selectivo. |
| `backend/imagenes/` | Keras exige que las etiquetas sean nombres de carpetas. La estructura de carpetas **es** el dataset etiquetado. |
| `frontend/` | Se compila a HTML/CSS/JS estático y se sirve desde Netlify. |
| `frontend/fuente/` | Vite necesita separar el código fuente de la salida compilada (`dist/`). Es `src` renombrado al español. |

### Por qué cada archivo del backend existe

| Archivo | Responsabilidad | Por qué está separado |
|---|---|---|
| `main.py` | Recibe peticiones HTTP, valida, responde JSON | Si mañana cambias FastAPI por Flask, solo tocas este archivo |
| `prediccion.py` | Bytes de imagen → diccionario de resultados | Se puede probar desde una terminal sin levantar el servidor. No sabe qué es HTTP |
| `entrenamiento.py` | Fotos → modelo entrenado | Corre en tu laptop, **nunca en Render**. Render solo predice |
| `razas.json` | Datos estáticos de las razas | Cambiar un dato no obliga a tocar código ni a reentrenar |

Esa separación es el único "patrón" del proyecto y es el que el profesor
va a preguntar: **la lógica de IA no depende del framework web.**

---

## 2. Cómo se comunican React y FastAPI

Son **dos programas distintos, en dos servidores distintos**, que solo se
conocen por una URL. No comparten memoria, ni variables, ni sesión.

```
NAVEGADOR (Netlify)                            SERVIDOR (Render)
┌───────────────────────┐                     ┌────────────────────────┐
│  aplicacion.jsx       │   POST /predecir    │  main.py               │
│                       │ ──────────────────► │                        │
│  FormData             │  multipart/form-data│  UploadFile            │
│    imagen: File       │                     │                        │
│                       │ ◄────────────────── │                        │
│  resultado (JSON)     │   200 OK + JSON     │                        │
└───────────────────────┘                     └────────────────────────┘
```

**El contrato entre ambos son tres cosas y nada más:**

1. La URL: `POST {VITE_API_URL}/predecir`
2. El nombre del campo: `imagen` (en React `datos.append("imagen", archivo)`,
   en FastAPI `imagen: UploadFile`). **Si no coinciden, error 422.**
3. La forma del JSON de respuesta.

### El JSON que devuelve el backend

```json
{
  "raza": "Border Collie",
  "confianza": 94.31,
  "informacion": {
    "nombre": "Border Collie",
    "pais_origen": "Reino Unido",
    "esperanza_vida": "12 - 15 años",
    "peso_promedio": "14 - 20 kg",
    "tamano": "Mediano",
    "nivel_energia": "Muy alto",
    "descripcion": "..."
  },
  "top": [
    { "clave": "border_collie", "raza": "Border Collie", "confianza": 94.31 },
    { "clave": "pastor_australiano", "raza": "Pastor Australiano", "confianza": 3.02 },
    { "clave": "akita", "raza": "Akita", "confianza": 0.91 }
  ]
}
```

### Rutas de la API

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/` | Estado del servicio. Sirve para saber si el modelo cargó |
| `GET` | `/razas` | Devuelve `razas.json` completo |
| `POST` | `/predecir` | Recibe la imagen y devuelve la predicción |
| `GET` | `/docs` | **Documentación interactiva que FastAPI genera sola.** Puedes probar la API sin React |

---

## 3. El flujo completo, paso a paso

```
  1. El usuario elige una foto
         │  <input type="file"> → onChange
         ▼
  2. React guarda el File en estado y genera una URL temporal
         │  URL.createObjectURL(archivo)  → la foto se ve SIN haberla subido
         ▼
  3. El usuario pulsa "Analizar imagen"
         │  setCargando(true) → arranca el barrido sobre la foto
         ▼
  4. React arma un FormData y hace fetch POST
         │  el navegador escribe solo la cabecera multipart/form-data
         ▼
  ═══════════════ CRUZA INTERNET ═══════════════
         ▼
  5. El navegador pregunta antes: "¿Render acepta peticiones de Netlify?"
         │  CORSMiddleware responde que sí (si no, todo muere aquí)
         ▼
  6. FastAPI recibe la petición en POST /predecir
         │  detecta UploadFile y deja el archivo disponible
         ▼
  7. main.py valida: ¿es JPG/PNG/WEBP? ¿pesa menos de 5 MB?
         │  si no → HTTP 400 con un mensaje en español
         ▼
  8. main.py lee los bytes y llama a prediccion.predecir(contenido)
         ▼
  9. procesar_imagen():
         │  bytes → Pillow → RGB → 224x224 → NumPy float32
         │  → expand_dims: (224,224,3) se vuelve (1,224,224,3)
         ▼
 10. _modelo.predict(tensor)
         │  el modelo YA estaba en RAM desde el arranque (lifespan)
         │  devuelve 25 probabilidades que suman 1.0
         ▼
 11. np.argsort() ordena, se toman los 3 mejores índices
         │  clases.json traduce índice → "border_collie"
         │  razas.json traduce "border_collie" → la ficha completa
         ▼
 12. Se arma el diccionario y se devuelve
         │  FastAPI lo convierte a JSON automáticamente
         ▼
  ═══════════════ CRUZA INTERNET ═══════════════
         ▼
 13. React recibe el JSON → setResultado(...) → setCargando(false)
         ▼
 14. Se pintan las tarjetas: raza, barra de confianza, ficha y Top 3
```

**Tiempo total esperado:** 1-3 segundos en local. En Render gratuito, la
*primera* petición del día puede tardar ~50 s porque el servicio estaba dormido.

---

## 4. Decisiones técnicas que debes poder defender

### El modelo se carga al arrancar, no en cada petición

En `main.py` existe una función `ciclo_de_vida` con `@asynccontextmanager`.
Lo que está antes del `yield` se ejecuta **una vez**, cuando el servidor sube.
Ahí se llama a `prediccion.cargar_modelo()`.

Si el modelo se cargara dentro de `/predecir`, cada petición leería 15 MB de
disco y reconstruiría el grafo: 5-8 segundos extra **por foto**. Es el error
de rendimiento más común en este tipo de proyectos y es una pregunta típica de
defensa.

### La normalización vive dentro del modelo

MobileNetV2 espera píxeles entre `-1` y `1`, no entre `0` y `255`. Esa
conversión está como **capa** (`layers.Rescaling`) dentro de la red, no como
paso suelto en `prediccion.py`.

Motivo: si entrenamiento y predicción usaran escalas distintas, el modelo daría
resultados basura sin lanzar ningún error. Al meterla dentro, el bug es
imposible.

### `clases.json` es tan importante como el modelo

La red no devuelve nombres, devuelve **posiciones**: `[0.02, 0.94, 0.01, ...]`.
Sin la lista que dice que la posición 1 es `border_collie`, esos números no
significan nada. Perder ese archivo = predicciones cruzadas silenciosas.

### CORS

El navegador bloquea por defecto que `mi-app.netlify.app` llame a
`mi-api.onrender.com`: son orígenes distintos. `CORSMiddleware` es el permiso
explícito. **No es opcional**, y no aparece cuando pruebas con `/docs` (ahí no
hay cruce de origen), solo cuando conectas React. Es la causa nº 1 de "en local
funcionaba".

---

## 5. Tres propuestas técnicas (revísalas antes de aprobar)

**a) `src/` renombrado a `fuente/`.** Pediste carpetas en español. Vite lo
acepta sin problema: solo cambia la ruta del `<script>` en `index.html`.
Si prefieres respetar la convención universal, se revierte en 10 segundos.

**b) Versiones del frontend: se fijaron todas a la rama estable.**

| Librería | Versión | Por qué esa |
|---|---|---|
| Tailwind | 3.4 | Lleva años en producción. Es la que aparece en todos los tutoriales y apuntes |
| React | 18.3 | La 19 es reciente y algunas librerías todavía no la siguen |
| Vite | 5.4 | Compatible sin fricción con React 18 y Tailwind 3 |

Compilación verificada: `npm run build` genera 13.8 kB de CSS y 154 kB de JS.

**c) El plan de Render gratuito da 512 MB de RAM y `tensorflow-cpu` ocupa
casi todo.** Es probable que el servicio muera con error de memoria. La
solución estándar es convertir el modelo a **TensorFlow Lite** (`.tflite`,
~4 MB) y usar `ai-edge-litert` para predecir, sin instalar TensorFlow completo
en el servidor: baja el consumo a ~150 MB y arranca en segundos.

**No hay que hacer nada ahora.** Es solo un aviso para que el problema no
sorprenda en la Fase 7. Primero conviene ver el modelo funcionando con Keras
normal en la laptop y entender la conversión cuando el `.keras` ya exista.
Además, "detecté un problema de memoria y lo resolví con cuantización a
TFLite" es material excelente para el apartado de Resultados de la exposición.

---

## 6. Qué falta (siguientes fases)

| Fase | Contenido |
|---|---|
| **1** | ✅ Arquitectura y esqueleto del proyecto |
| **2** | Dataset: descargar Stanford Dogs, filtrar 25 razas × 150 fotos, script `preparar_datos.py` |
| **3** | Entrenamiento y teoría (Transfer Learning, épocas, batch size, learning rate, overfitting...) |
| **4** | Evaluación: matriz de confusión, precision, recall, F1 |
| **5** | Backend funcionando en local y probado desde `/docs` |
| **6** | Frontend conectado |
| **7** | Despliegue en Render + Netlify |
| **8** | Defensa: introducción, objetivos, estado del arte, conclusiones y batería de preguntas difíciles |
