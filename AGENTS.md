<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Canvas SaaS — Contexto del proyecto

> Este archivo es la memoria persistente del proyecto. Léelo al inicio de cada sesión.
> El spec completo vive en `CANVAS_SAAS_SPEC.md` y es el single source of truth.

## Producto

**Canvas SaaS** es una plataforma agéntica de diseño multicanal. Un diseñador escribe un brief en lenguaje natural y un pipeline de agentes especializados genera piezas coherentes para varios canales (social, web, OOH, email, presentaciones), respetando identidad de marca, formatos y jerarquías.

**Diferenciadores core:**
- **Control:** iteraciones directas, no cajas negras. El diseñador dirige cada refinamiento.
- **Coherencia multicanal:** una campaña → N formatos coherentes entre sí.
- **Calidad:** piezas profesionales usables. Sin "AI slop".
- **Velocidad:** del brief al primer batch en minutos.
- **Memoria de marca:** análisis de campañas anteriores para evolución coherente.

## Modelo de datos

Jerarquía: **Empresa → Marca → versiones de Brand Guidelines → Campañas.**

Una marca puede tener múltiples versiones de guidelines simultáneamente (ej. "v1.0 Launch 2024", "v2.0 Rebrand Q2"). Cada campaña referencia una versión específica o un override custom. Las definiciones TypeScript de Empresa, Marca, BrandGuidelines y Campaña viven (o vivirán) en src/lib/types.ts. Consultar CANVAS_SAAS_SPEC.md sección "Data Model Core" para los shapes exactos.

## Pipeline de agentes (8 en secuencia)

Brief Analyst → Brand Analyzer → Brand Historian → Creative Director → Copywriter → Art Director → Image Generation → Layout Composer

El **Brand Historian** es el agente que da memoria de marca evolutiva — analiza campañas pasadas para detectar elementos consistentes, evoluciones, y patrones exitosos. El **Creative Director** consume su salida para proponer conceptos coherentes con la trayectoria de la marca.

Detalles de input/output por agente: ver CANVAS_SAAS_SPEC.md sección "Agent System Architecture".

## Stack técnico

- **Frontend/Backend:** Next.js 15 con App Router + TypeScript + Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL + Storage) — aún no integrado
- **IA:** Claude API (Anthropic) para los agentes de texto + Replicate (Flux/Ideogram) para generación de imágenes
- **Render:** Puppeteer/Playwright + @vercel/og para HTML → PNG
- **Deploy:** Vercel (planeado)

## Roadmap (4 fases)

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Foundation | ✓ Hecho |
| 1 | MVP Dashboard | En curso |
| 2 | Agent System | Pendiente |
| 3 | Brand Memory | Pendiente |
| 4 | Production Polish | Pendiente |

## Estado actual del código

### Routing (App Router)

- `/` — Landing pública con dos CTAs principales: **"Campaña Rápida"** → `/quick-campaign` y **"Setup Completo"** → `/dashboard`. Incluye sección con los 5 diferenciadores.
- `/quick-campaign` — Wizard de campaña sin marca configurada. Sidebar de progreso técnico con 5 pasos: Brief → Brand Guidelines → Referencias Visuales → Output Specs → Preview & Generate. Navegación entre pasos con useState. **Hoy contiene un placeholder marcado con TODO** donde va la UI real del wizard.
- `/dashboard` — Dashboard empresarial con sidebar (Mis Marcas, Campañas Recientes, Configuración, Facturación), empty states para marcas y campañas, y quick actions para nueva marca/campaña **aún sin handlers conectados**.

### Backup local (no en repo)

`src/app/page.tsx.backup` contiene la versión anterior del page.tsx con un toggle showProduct true/false que mostraba landing o wizard en la misma URL. La UI del wizard real vive ahí y debe migrarse a quick-campaign/page.tsx. **No subir este archivo al repo** — es referencia local del propietario.

## Sistema de diseño

DNA editorial dark, mantener estricta consistencia:

- **Fondo principal:** `#0A0A0A`
- **Texto principal:** `#F5F5F5` (off-white)
- **Bordes sutiles:** `rgba(255,255,255,0.08)` — clase Tailwind `border-white/[0.08]`
- **Bordes hover:** `rgba(255,255,255,0.12)` o `0.30` para énfasis
- **Tipografía display:** `Instrument Serif` (Google Fonts), usado en italic para acentos editoriales
- **Tipografía body:** `Geist` (Google Fonts) — **nunca Inter, Arial, ni system fonts**
- **Acentos uppercase:** `tracking-[0.2em]` o `tracking-[0.3em]` con tamaños `text-[10px]` o `text-xs`
- **CTAs primarios:** botón blanco sólido con texto negro
- **CTAs secundarios:** ghost con borde sutil

Hoy las fonts están duplicadas con next/font/google en cada page.tsx. Tarea pendiente: moverlas a src/app/layout.tsx con CSS variables y aplicar al body.

## Decisiones pendientes

1. **Estado del wizard:** ¿persistir entre pasos en URL params, store (Zustand), o localStorage?
2. **Fonts globales:** mover a layout.tsx para evitar duplicación en cada página.
3. **Supabase:** definir cuándo arrancar la integración. El dashboard sin backend es solo cosmético.
4. **Página de marca individual:** falta ruta /dashboard/brands/[brandId] para editar guidelines y ver historial de campañas.

## Convenciones de código

- **TypeScript estricto.** No usar any salvo como placeholder explícito comentado.
- **Server components por defecto.** Solo agregar 'use client' cuando se usen hooks de React, eventos del DOM, o APIs del navegador.
- **Tailwind utility classes.** Evitar CSS custom salvo en globals.css para resets o tokens globales.
- **Nada de bibliotecas pesadas sin discutir.** Antes de agregar dependencias (Zustand, Framer Motion, shadcn/ui, etc.) proponerlo y esperar aprobación.
- **Archivos pequeños y enfocados.** Si una page.tsx pasa de ~300 líneas, considerar extraer componentes a src/components/.

## Cómo trabajar en este repo

1. Antes de cualquier cambio, leer CANVAS_SAAS_SPEC.md para entender la fase y prioridad actual.
2. Confirmar en qué archivos vas a tocar antes de empezar; no editar archivos fuera del scope acordado.
3. Mantener la estética del sistema de diseño en CADA cambio visual. Si dudas del color o token, revisar otra page.tsx ya hecha como referencia.
4. Commits descriptivos en español: feat:, fix:, refactor:, docs:, etc.
5. Si encuentras decisiones implícitas que valga la pena documentar, agregarlas a este AGENTS.md en la sección correspondiente.
