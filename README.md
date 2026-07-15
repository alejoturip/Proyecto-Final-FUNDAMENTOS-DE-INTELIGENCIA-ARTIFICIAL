# Identificador de razas caninas

Aplicación web que reconoce la raza de un perro a partir de una foto, usando una
red neuronal **MobileNetV2** entrenada con Transfer Learning sobre **25 razas**.
Precisión ~92% en validación.

Proyecto de la materia **Fundamentos de Inteligencia Artificial**.

| Capa | Tecnología |
|---|---|
| Frontend | React 18 · Vite 5 · Tailwind 3.4 — desplegado en **Netlify** |
| Backend | Python · FastAPI · Uvicorn — desplegado en **Render** |
| IA | MobileNetV2 · Transfer Learning · **TensorFlow Lite** en producción |

> **Python 3.12** para el backend (TensorFlow no tiene versión para 3.13/3.14).

---

## Correr en local

### Backend

```bash
cd backend
py -3.12 -m venv venv
venv\Scripts\activate                       # Windows
pip install -r requirements-desarrollo.txt  # incluye TensorFlow (entrenar y correr en local)
uvicorn main:app --reload
```

- API: <http://localhost:8000>
- Documentación interactiva (probar sin React): <http://localhost:8000/docs>

### Frontend

```bash
cd frontend
npm install
copy .env.example .env      # cp en Linux/macOS
npm run dev
```

- Aplicación: <http://localhost:5173>

---

## Rutas de la API

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/` | Estado del servicio (si el modelo cargó) |
| `GET` | `/razas` | Ficha de las 25 razas |
| `POST` | `/predecir` | Recibe una imagen y devuelve la predicción (raza, confianza, Top 3) |
| `GET` | `/metricas` | Métricas del modelo (accuracy, precision/recall/F1 por raza, historial) |
| `GET` | `/matriz-confusion` | Imagen PNG de la matriz de confusión |
| `GET` | `/docs` | Documentación interactiva |

---

## Reentrenar el modelo (opcional)

Todo el proceso (dataset → entrenar → evaluar → convertir a TFLite) en un comando:

```bash
cd backend
python ejecutar_todo.py
```

El entrenamiento acepta **parámetros configurables**:

```bash
python entrenamiento.py --help
python entrenamiento.py --epocas-ajuste 15 --batch 16 --capas 80
```

Genera en `backend/modelo/`: `modelo_razas.tflite` (el que usa el servidor),
`metricas.json`, `matriz_confusion.png` y `reporte_evaluacion.txt`.

---

## Producción: TensorFlow Lite

El servidor **no** usa TensorFlow completo (no entra en los 512 MB de Render). El
modelo se convierte a `.tflite` (~2 MB) y se sirve con el runtime liviano
`ai-edge-litert`, bajando el consumo a ~150 MB.

- `requirements.txt` → dependencias de **producción** (Render, sin TensorFlow).
- `requirements-desarrollo.txt` → **desarrollo** (entrenar, evaluar, convertir).

En Render, fijar la variable `PYTHON_VERSION=3.12.10`.

---

## Variables de entorno

| Dónde | Variable | Local | Producción |
|---|---|---|---|
| Frontend | `VITE_API_URL` | `http://localhost:8000` | `https://tu-api.onrender.com` |
| Backend | `ORIGENES_PERMITIDOS` | `http://localhost:5173` | `https://tu-app.netlify.app` |

`ORIGENES_PERMITIDOS` acepta varios orígenes separados por coma. Si el frontend
no puede hablar con el backend, casi siempre es esta variable (CORS).

> El frontend "hornea" `VITE_API_URL` al compilar: para desplegar en Netlify hay
> que hacer `npm run build` **con la URL de Render ya puesta** en esa variable.

---

## Convenciones del proyecto

- Carpetas, archivos, variables y funciones **en español**.
- Sin base de datos: `razas.json` cumple ese papel.
- Toda la interfaz vive en `frontend/fuente/aplicacion.jsx`.
- Colores y tipografías solo desde `tailwind.config.js` (nada de `#hex` en el JSX).
