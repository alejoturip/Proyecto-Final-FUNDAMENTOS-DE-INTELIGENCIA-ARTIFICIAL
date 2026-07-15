# Informe Final — Identificador de Razas Caninas

**Escuela Politécnica Nacional · Escuela de Formación de Tecnólogos**
**Asignatura:** Fundamentos de Inteligencia Artificial · **Período:** 2026-A
**Integrantes:** Alejandro Fabara · Marcos ______
**Repositorio:** https://github.com/alejoturip/Proyecto-Final-FUNDAMENTOS-DE-INTELIGENCIA-ARTIFICIAL

---

## 1. Resumen

Se desarrolló una aplicación web (backend + frontend) que identifica la **raza
de un perro** a partir de una fotografía usando una red neuronal convolucional.
El modelo se construyó con **Transfer Learning** sobre **MobileNetV2** y reconoce
**25 razas** populares, alcanzando una **exactitud del 91.8%** sobre un conjunto
de validación de 851 imágenes que la red nunca vio durante el entrenamiento.

El sistema permite entrenar el modelo con parámetros configurables, exponerlo a
través de una API REST, mostrar las métricas del entrenamiento y recibir nuevas
imágenes para predecir su raza en tiempo real.

---

## 2. Introducción

Reconocer la raza de un perro a simple vista requiere experiencia: existen más de
340 razas y muchas comparten rasgos físicos. Este proyecto aplica **visión por
computadora** para automatizar esa tarea: el usuario sube una foto y el sistema
responde con la raza más probable, su nivel de confianza, las tres candidatas más
probables y una ficha informativa de la raza detectada.

El proyecto corresponde al enfoque de **clasificación de imágenes**, uno de los
propuestos en las indicaciones de la asignatura.

---

## 3. Motivación

- **¿Por qué este tema?** La clasificación de imágenes es uno de los problemas
  más representativos de la IA moderna y permite tocar todos los conceptos del
  curso (redes neuronales, entrenamiento, sobreajuste, métricas) sobre un caso
  concreto y visual.
- **¿Qué problema aborda?** Identificar razas caninas es útil en veterinarias,
  refugios de animales y aplicaciones de adopción, donde muchas veces llega un
  animal sin información de su raza.
- **¿Por qué es relevante?** Demuestra cómo, con **Transfer Learning**, un
  estudiante puede resolver en una laptop un problema que hace una década exigía
  supercomputadoras y millones de imágenes.
- **¿Cuál es el aporte de la IA?** La IA extrae automáticamente los patrones
  visuales (forma de orejas, hocico, pelaje, proporciones) que distinguen una
  raza de otra, sin que nadie los programe explícitamente.

---

## 4. Objetivos

**General:** Desarrollar una aplicación funcional (backend y frontend) que
aplique un modelo de Inteligencia Artificial para clasificar la raza de un perro
a partir de una imagen.

**Específicos:**
- Construir y entrenar un modelo de clasificación de imágenes con Transfer Learning.
- Exponer el modelo mediante una API REST e integrarlo con una interfaz web.
- Permitir configurar los parámetros del entrenamiento y mostrar sus métricas.
- Desplegar la aplicación para que sea accesible en línea.
- Preparar la defensa técnica del proyecto.

---

## 5. Alcance

**Incluye:** clasificación de 25 razas caninas; interfaz web para subir imágenes
y ver resultados; API con endpoints de predicción, métricas y estado; despliegue
en la nube (Netlify + Render).

**No incluye:** detección de múltiples perros en una misma foto; razas fuera de
las 25 entrenadas (ante una raza desconocida el modelo devuelve la más parecida,
con baja confianza); identificación de perros mestizos como tales.

---

## 6. Estado del arte

- **ImageNet** (Deng et al., 2009): base de datos de 1.2 millones de imágenes que
  hizo posible el entrenamiento de redes profundas de propósito general. Nuestro
  modelo parte de pesos preentrenados en ImageNet.
- **MobileNetV2** (Sandler et al., 2018): arquitectura de red convolucional
  eficiente, diseñada para dispositivos con pocos recursos. Es la base de nuestro
  modelo por su equilibrio entre precisión y tamaño (~14 MB).
- **Stanford Dogs Dataset** (Khosla et al., 2011): dataset especializado de 120
  razas y 20 580 imágenes, derivado de ImageNet. Es la fuente principal de
  nuestras imágenes de entrenamiento.
- **Transfer Learning** (Pan & Yang, 2010): técnica de reutilizar el conocimiento
  de un modelo entrenado en una tarea para resolver otra relacionada con muchos
  menos datos. Es el pilar metodológico del proyecto.

---

## 7. Arquitectura del sistema

Son **dos aplicaciones independientes** que se comunican por una URL:

```
NAVEGADOR (Netlify)                         SERVIDOR (Render)
┌──────────────────────┐   POST /predecir   ┌──────────────────────┐
│  React + Vite        │ ─────────────────► │  FastAPI (main.py)   │
│  aplicacion.jsx      │  multipart/form     │  prediccion.py       │
│                      │ ◄───────────────── │  modelo_razas.tflite │
│  resultado (JSON)    │   200 OK + JSON     │                      │
└──────────────────────┘                     └──────────────────────┘
```

**Separación de responsabilidades del backend:**

| Archivo | Responsabilidad |
|---|---|
| `main.py` | Única capa que conoce HTTP: define las rutas de la API y CORS. |
| `prediccion.py` | La IA en uso: recibe bytes de imagen y devuelve predicciones. No sabe de HTTP. |
| `entrenamiento.py` | Entrena el modelo (se ejecuta una vez en la laptop). |
| `evaluar.py` | Calcula las métricas de calidad del modelo. |
| `convertir_tflite.py` | Convierte el modelo entrenado a TensorFlow Lite para producción. |
| `razas.json` | "Base de datos" con la ficha de cada raza (sin motor de BD). |

**Flujo completo:** el usuario elige una foto → React la muestra y la envía por
`POST /predecir` como `multipart/form-data` → FastAPI valida tipo y tamaño → la
imagen se convierte a un tensor 224×224 → el modelo devuelve 25 probabilidades →
se toman las 3 mayores y se arma el JSON → React pinta raza, confianza, Top 3 y ficha.

---

## 8. El modelo de Inteligencia Artificial

### 8.1 Transfer Learning con MobileNetV2

En lugar de entrenar una red desde cero (que requeriría millones de imágenes), se
parte de **MobileNetV2 preentrenada en ImageNet**, que ya sabe detectar bordes,
texturas, orejas y pelaje. Solo se le enseña la parte final: distinguir las 25 razas.

### 8.2 Entrenamiento en dos etapas

1. **Etapa 1 — base congelada** (10 épocas, learning rate 1e-3): se entrena solo
   la capa de clasificación nueva. Los pesos de MobileNetV2 no se tocan.
2. **Etapa 2 — ajuste fino** (hasta 12 épocas, learning rate 1e-5, últimas 60
   capas descongeladas): se afina la parte alta de MobileNetV2 para especializarla
   en perros, con un learning rate 100 veces menor para no destruir lo aprendido.
   Un **EarlyStopping** detiene el entrenamiento cuando la validación deja de mejorar.

### 8.3 Defensas contra el sobreajuste (overfitting)

- **Aumento de datos**: giros, rotaciones, zoom y contraste aleatorios generan
  variaciones de cada foto en cada época.
- **Dropout (0.3)**: apaga el 30% de las neuronas al azar durante el entrenamiento.
- **Conjunto de validación (20%)**: imágenes que la red nunca usa para aprender.
- **EarlyStopping**: evita entrenar de más.

### 8.4 Parámetros configurables (requisito de la rúbrica)

```bash
python entrenamiento.py --help
python entrenamiento.py --epocas-ajuste 15 --batch 16 --capas 80 --lr-ajuste 1e-5
```

| Parámetro | Qué controla |
|---|---|
| `--epocas-cabeza` / `--epocas-ajuste` | Vueltas al dataset en cada etapa |
| `--batch` | Tamaño de lote (imágenes por paso de ajuste) |
| `--lr-cabeza` / `--lr-ajuste` | Tasa de aprendizaje de cada etapa |
| `--capas` | Cuántas capas finales de MobileNetV2 se descongelan |

---

## 9. Dataset

- **25 razas**, ~150–250 imágenes por raza, **4 256 imágenes** en total.
- **21 razas** provienen de **Stanford Dogs**; el script `preparar_datos.py` lo
  descarga y filtra automáticamente.
- **4 razas** (dachshund, bulldog inglés, pastor australiano, akita) no existen en
  Stanford Dogs y se complementaron desde **Wikimedia Commons** con
  `completar_razas.py`, respetando las políticas de uso de sus servidores.
- Reparto: **80% entrenamiento / 20% validación**.

---

## 10. Resultados

**Exactitud global (accuracy): 91.8%** sobre 851 imágenes de validación.

| Métrica (promedio macro) | Valor |
|---|---|
| Precision | 0.917 |
| Recall | 0.913 |
| F1-score | 0.913 |

**Mejores razas** (F1): Pastor Alemán 1.000 · Caniche 0.986 · Yorkshire 0.975 ·
Beagle 0.974 · San Bernardo 0.969 · Husky 0.961.

**Razas más difíciles** (F1): Dachshund 0.746 · Akita 0.809 · Chihuahua 0.828 ·
Pastor Australiano 0.833 · Dóberman 0.839.

**Análisis:** las razas con menor rendimiento son, en su mayoría, las que se
complementaron desde Wikimedia Commons (dachshund, akita, pastor australiano),
cuyas fotos son más heterogéneas (fondos, ángulos, ejemplares mezclados) que las
curadas de Stanford Dogs. Esto confirma un principio central del curso: **la
calidad de los datos condiciona directamente la calidad del modelo.**

Las métricas y la matriz de confusión se pueden consultar dentro de la propia
aplicación (botón "Ver métricas del modelo") o por la API (`GET /metricas`).

---

## 11. Optimización para producción (TensorFlow Lite)

El plan gratuito de Render ofrece **512 MB de RAM**, y TensorFlow completo
(~450 MB) no entra: el servicio se caía por falta de memoria. La solución fue
convertir el modelo a **TensorFlow Lite** con cuantización dinámica:

| | Antes (Keras + TF) | Después (TFLite) |
|---|---|---|
| Tamaño del modelo | 23 MB | **2.4 MB** |
| RAM en el servidor | ~450 MB | **~150 MB** |
| Runtime instalado | TensorFlow (~400 MB) | ai-edge-litert (pocos MB) |

Las predicciones del modelo TFLite se verificaron idénticas a las del original.
Esta optimización es un ejemplo concreto de una decisión técnica justificada por
una restricción real de despliegue.

---

## 12. Manual técnico (instalación y uso)

**Requisito:** Python 3.12 (TensorFlow no soporta 3.13/3.14) y Node.js 20+.

**Backend:**
```bash
cd backend
py -3.12 -m venv venv
venv\Scripts\activate
pip install -r requirements-desarrollo.txt   # TensorFlow para entrenar y correr en local
uvicorn main:app --reload                     # API en http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
copy .env.example .env
npm run dev                                    # App en http://localhost:5173
```

**Reentrenar todo el pipeline:** `python ejecutar_todo.py`

**Despliegue:** frontend en Netlify (`npm run build` con `VITE_API_URL` apuntando
a Render) y backend en Render (root `backend`, `PYTHON_VERSION=3.12.10`,
start `uvicorn main:app --host 0.0.0.0 --port $PORT`).

---

## 13. Cumplimiento de los requisitos mínimos

| Requisito | Cómo se cumple |
|---|---|
| Entrenar el modelo | `entrenamiento.py` (Transfer Learning en 2 etapas) |
| Crear un API e implementarlo | FastAPI (`main.py`), desplegado en Render |
| Configurar parámetros | Parámetros por línea de comando en `entrenamiento.py` |
| Mostrar métricas del entrenamiento | Endpoint `/metricas` + panel en la app |
| Recibir nuevos datos y predecir | `POST /predecir` (subir foto → predicción) |

---

## 14. Conclusiones

- Con **Transfer Learning** se alcanzó **91.8% de exactitud** en 25 razas usando
  solo ~4 000 imágenes y una laptop sin GPU, algo inviable entrenando desde cero.
- La arquitectura desacoplada (IA separada del framework web) permitió probar,
  optimizar y desplegar cada parte de forma independiente.
- La conversión a **TensorFlow Lite** fue clave para desplegar en un servidor con
  recursos limitados, reduciendo el consumo de memoria en ~3x.
- El rendimiento por raza demostró empíricamente que **la calidad del dataset**
  es tan importante como la arquitectura del modelo.

---

## 15. Recomendaciones y trabajos futuros

- **Mejorar las razas débiles** ampliando y depurando sus imágenes (sobre todo las
  tomadas de Wikimedia Commons).
- **Detección previa de perro**: rechazar imágenes que no contengan un perro antes
  de clasificar.
- **Ampliar el número de razas** y añadir manejo explícito de mestizos.
- **Cuantización completa a enteros (int8)** para acelerar aún más la inferencia.
- **Aplicación móvil**: el formato TFLite permite llevar el modelo a Android/iOS
  sin servidor.

---

## 16. Referencias

- Deng, J. et al. (2009). *ImageNet: A Large-Scale Hierarchical Image Database.* CVPR.
- Sandler, M. et al. (2018). *MobileNetV2: Inverted Residuals and Linear Bottlenecks.* CVPR.
- Khosla, A. et al. (2011). *Novel Dataset for Fine-Grained Image Categorization: Stanford Dogs.* CVPR Workshop.
- Pan, S. J. & Yang, Q. (2010). *A Survey on Transfer Learning.* IEEE TKDE.
- Documentación de TensorFlow, Keras, FastAPI, React y TensorFlow Lite.
