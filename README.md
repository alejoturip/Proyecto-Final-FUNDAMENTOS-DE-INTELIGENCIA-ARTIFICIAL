# Identificador de razas caninas

Aplicación web que reconoce la raza de un perro a partir de una fotografía,
usando una red neuronal MobileNetV2 entrenada con Transfer Learning sobre
25 razas populares.

Proyecto de la materia **Fundamentos de Inteligencia Artificial**.

| Capa | Tecnología |
|---|---|
| Frontend | React 18 · Vite 5 · Tailwind 3.4 |
| Backend | Python · FastAPI · Uvicorn |
| IA | TensorFlow · Keras · MobileNetV2 |
| Despliegue | Vercel (frontend) · Render (backend) |

Antes de programar nada, lee **[ARQUITECTURA.md](ARQUITECTURA.md)**.

---

## Estado actual

- [x] **Fase 1** — Arquitectura y esqueleto
- [x] **Fase 2** — Dataset: 25 razas (21 de Stanford Dogs + 4 de Wikimedia Commons)
- [x] **Fase 3** — Entrenamiento (MobileNetV2, Transfer Learning en 2 etapas)
- [x] **Fase 4** — Evaluación: matriz de confusión + precision/recall/F1 (~90% accuracy)
- [x] **Fase 5** — Backend funcionando (FastAPI + modelo TFLite)
- [x] **Fase 6** — Frontend conectado
- [~] **Fase 7** — Despliegue (Netlify + Render)
- [ ] **Fase 8** — Informe y defensa

> ⚠️ **Versión de Python.** TensorFlow no existe para Python 3.14. Usa
> **Python 3.12** para el backend (en Render: variable `PYTHON_VERSION=3.12.10`).
> Comprueba con `python --version` antes de crear el `venv`.

### Cómo se generó el modelo (una vez, en la laptop)

```bash
cd backend
python ejecutar_todo.py    # dataset -> completar razas -> entrenar -> evaluar -> TFLite
```

O paso por paso: `preparar_datos.py` → `completar_razas.py` → `entrenamiento.py`
→ `evaluar.py` → `convertir_tflite.py`.

**Entrenamiento con parámetros configurables:**

```bash
python entrenamiento.py --help          # ver todos los parámetros
python entrenamiento.py --epocas-ajuste 15 --batch 16 --capas 80
```

### Rutas de la API

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/` | Estado del servicio (si el modelo cargó) |
| `GET` | `/razas` | Ficha de las 25 razas |
| `POST` | `/predecir` | Recibe una imagen y devuelve la predicción |
| `GET` | `/metricas` | Métricas del modelo (accuracy, precision/recall/F1, historial) |
| `GET` | `/matriz-confusion` | Imagen PNG de la matriz de confusión |
| `GET` | `/docs` | Documentación interactiva (probar la API sin React) |

### Producción: TensorFlow Lite

El servidor **no** usa TensorFlow completo (no entra en los 512 MB de Render).
El modelo se convierte a `.tflite` (~2 MB) con `convertir_tflite.py` y se sirve
con el runtime liviano `ai-edge-litert`. Ver `requirements.txt` (producción) vs
`requirements-desarrollo.txt` (entrenamiento y evaluación).

---

## Fase 2 — Preparar el dataset

`backend/preparar_datos.py` descarga **Stanford Dogs** (~757 MB), filtra las 25
razas del proyecto y llena `backend/imagenes/`. No necesita ninguna librería
(solo Python estándar), así que puede correr antes de instalar TensorFlow.

```bash
cd backend
python preparar_datos.py              # descarga, extrae y copia ~200 fotos/raza
# python preparar_datos.py --por-clase 150          # menos fotos por raza
# python preparar_datos.py --tar C:/ruta/images.tar # usar un tar ya bajado
```

**5 razas NO están en Stanford Dogs** y el script deja su carpeta vacía con un
`LEEME_APORTAR.txt`. Hay que ponerles ~150 fotos JPG a mano (Kaggle, Wikimedia
Commons, Google Imágenes) y borrar ese archivo:

- `dachshund`
- `bulldog_frances`
- `bulldog_ingles`
- `pastor_australiano`
- `akita`

Cuando las 25 carpetas tengan fotos, sigue con el entrenamiento (Fase 3).

---

## Backend

```bash
cd backend

# 1. Entorno virtual (aísla las librerías de este proyecto)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS

# 2. Dependencias (tarda: TensorFlow pesa ~250 MB)
pip install -r requirements.txt

# 3. Entrenar (solo una vez, requiere el dataset de la Fase 2)
python entrenamiento.py

# 4. Levantar la API
uvicorn main:app --reload
```

- API: <http://localhost:8000>
- **Documentación interactiva: <http://localhost:8000/docs>** ← aquí puedes
  subir una foto y probar el modelo sin necesidad de React.

`--reload` reinicia el servidor solo al guardar un archivo. Nunca se usa en
producción.

## Frontend

```bash
cd frontend

npm install
cp .env.example .env    # copy .env.example .env  en Windows
npm run dev
```

- Aplicación: <http://localhost:5173>

---

## Variables de entorno

| Dónde | Variable | Valor en local | Valor en producción |
|---|---|---|---|
| Frontend | `VITE_API_URL` | `http://localhost:8000` | `https://tu-api.onrender.com` |
| Backend | `ORIGENES_PERMITIDOS` | `http://localhost:5173` | `https://tu-app.vercel.app` |

`ORIGENES_PERMITIDOS` acepta varios orígenes separados por coma.
Si el frontend no puede hablar con el backend, el 90% de las veces es esta
variable.

---

## Convenciones del proyecto

- Carpetas, archivos, variables y funciones **en español**.
- Sin base de datos: `razas.json` cumple ese papel.
- Sin carpetas de `components`, `services` ni `utils`: la interfaz completa
  vive en `fuente/aplicacion.jsx`.
- Colores y tipografías solo desde `tailwind.config.js`.
  Nada de `#hex` sueltos en el JSX.
