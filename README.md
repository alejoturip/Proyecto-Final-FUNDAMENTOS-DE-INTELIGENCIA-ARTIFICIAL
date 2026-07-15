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
- [~] **Fase 2** — Dataset: script `preparar_datos.py` listo. Falta ejecutarlo
  y aportar a mano 5 razas que no están en Stanford Dogs (ver abajo).
- [ ] **Fase 3** — Entrenamiento
- [ ] Fases 4 a 8

> El backend **todavía no arranca**: `prediccion.py` busca
> `backend/modelo/modelo_razas.keras` y ese archivo no existe hasta ejecutar
> el entrenamiento. Es lo esperado en esta fase.

> ⚠️ **Versión de Python.** TensorFlow no existe aún para Python 3.14. Usa
> **Python 3.11, 3.12 o 3.13** para el backend. Comprueba con `python --version`
> antes de crear el `venv`. (El frontend no depende de Python.)

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
