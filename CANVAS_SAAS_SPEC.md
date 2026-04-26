# Canvas SaaS - Especificación Completa

## Project Overview

**Plataforma SaaS agéntica para diseño multicanal** donde un diseñador ingresa un brief en lenguaje natural y un sistema de agentes especializados genera piezas de diseño coherentes para múltiples canales (social, web, OOH, email, presentaciones) respetando identidad de marca, formatos y jerarquías.

### Diferenciadores Core
- **Control:** iteraciones directas, no cajas negras - el diseñador dirige refinamientos
- **Coherencia multicanal:** una campaña → N formatos coherentes entre sí
- **Calidad:** piezas usables profesionales, no "AI slop"
- **Velocidad:** brief → primer batch en minutos
- **Memoria de marca:** análisis de campañas anteriores para coherencia evolutiva

---

## Arquitectura de Datos

### Jerarquía Empresarial
```
Empresa/Account
├── Marca 1
│   ├── Brand Guidelines v1.0 ("Launch 2024")  
│   ├── Brand Guidelines v2.0 ("Rebrand Q2")
│   ├── Campaña A (usa guidelines v1.0)
│   ├── Campaña B (usa guidelines v2.0)
│   └── Campaña C (override custom)
├── Marca 2
│   ├── Brand Guidelines v1.0
│   └── Campaña A
```

### Data Model Core
```typescript
interface Empresa {
  id: string;
  name: string;
  marcas: Marca[];
}

interface Marca {
  id: string;
  name: string;
  brandGuidelineVersions: BrandGuidelines[];
  campañas: Campaña[];
  createdAt: Date;
}

interface BrandGuidelines {
  id: string;
  version: string; // "v1.0", "Rebrand Q2 2024"
  isActive: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    headline: string;
    body: string;
  };
  logo: File;
  logoAlt?: File;
  style: string[]; // ['minimal', 'bold', etc.]
  createdAt: Date;
}

interface Campaña {
  id: string;
  name: string;
  brief: string;
  campaignType: 'promotional' | 'branding' | 'launch' | 'seasonal';
  brandGuidelinesUsed: BrandGuidelines; // puede ser override
  visualReferences: VisualReference[];
  outputSpecs: OutputSpecs;
  generatedAssets: GeneratedAsset[];
  creativeConcept: string; // para histórico Creative Director
  createdAt: Date;
}
```

---

## Frontend Architecture

### 1. Landing Page con Bifurcación

**DNA Editorial Maintained:**
- Dark mode #0A0A0A
- Tipografía dramática
- Bordes sutiles rgba(255,255,255,0.08)

**Nuevo CTA Dual:**
```
Hero Section:
├── "Campaña Rápida" → Wizard directo (sin marca)
└── "Setup Completo" → Dashboard empresarial
```

### 2. Dashboard Empresarial

**Layout:**
```
├── Sidebar
│   ├── Mis Marcas
│   ├── Campañas Recientes  
│   ├── Configuración
│   └── Facturación
├── Main Area
│   ├── Vista Marcas: Cards + stats + "Nueva Campaña"
│   └── Vista Campañas: Filtro por marca + histórico
```

**Key Features:**
- Grid de marcas con stats (campañas, assets generados, última actividad)
- Timeline de campañas recientes cross-brand
- Quick actions: "Nueva Campaña", "Nueva Marca"

### 3. Gestión de Marca

**Setup Wizard:**
```
Step 1: Información básica (nombre, descripción)
Step 2: Brand Guidelines (colores, tipografías, logos)
Step 3: Estilo visual (minimal, bold, etc.)
Step 4: Review & Create
```

**Versionado:**
- Cada marca puede tener múltiples versiones de guidelines activas
- Timeline visual de evolución de marca
- Comparación side-by-side entre versiones

### 4. Wizard de Campaña Enhanced

**Nuevo Flujo:**
```
Step 0: [OPCIONAL] Seleccionar Marca 
        ├── Si viene de dashboard → marca pre-seleccionada
        └── Si es campaña rápida → skip o crear marca temporal
Step 1: Brief de Campaña
Step 2: Brand Guidelines 
        ├── Pre-filled si tiene marca
        ├── Editable/override para esta campaña
        └── Opción "crear nueva versión" 
Step 3: Referencias Visuales
Step 4: Output Specifications
Step 5: Preview & Generate
```

**Mejoras UX:**
- Sidebar con progreso técnico (como tenemos ahora)
- Preview en tiempo real de brand guidelines aplicados
- Estimación de costo/tiempo por configuración

---

## Agent System Architecture

### Agent Flow Completo

```
User Input (Brief + Brand + References + Specs)
         ↓
[1] Brief Analyst → Brief estructurado
         ↓
[2] Brand Analyzer → Brand DNA + Visual analysis 
         ↓
[3] Brand Historian → Análisis de campañas anteriores (si existe marca)
         ↓
[4] Creative Director → Concepto creativo (con contexto histórico)
         ↓
[5] Copywriter → Copy específico por canal
         ↓
[6] Art Director → Prompts de imagen detallados
         ↓
[7] Image Generation → Imágenes generadas
         ↓
[8] Layout Composer → HTML/CSS final por formato
         ↓
Render Engine (Puppeteer/Satori) → PNG assets
```

### 1. Brief Analyst Agent
- **Input:** Brief raw (string)
- **Output:** 
```json
{
  "objetivo": "Impulsar ventas Black Friday",
  "audiencia": "Hombres y mujeres 18-35, urbanos",
  "tono": "Rebelde, auténtico",
  "ocasion": "Black Friday 2026",
  "cta": "Compra ahora con 40% descuento",
  "restricciones": ["No precios específicos", "Evitar rojo/verde navideño"]
}
```

### 2. Brand Analyzer Agent  
- **Input:** BrandGuidelines + uploaded references
- **Output:**
```json
{
  "colorPalette": {
    "primary": "#1A1A1A",
    "secondary": "#FF6B35", 
    "accent": "#F5F5F5"
  },
  "typography": {
    "headline": "Bebas Neue",
    "body": "Inter"
  },
  "visualStyle": ["minimal", "high-contrast", "urban"],
  "logoAnalysis": {
    "style": "wordmark",
    "weight": "bold", 
    "preferredPlacement": "top-left"
  }
}
```

### 3. Brand Historian Agent *(NUEVO)*
- **Input:** Marca + historical campaigns
- **Output:**
```json
{
  "brandEvolution": {
    "consistentElements": ["Always minimal", "Orange accent color"],
    "evolvingElements": ["Typography bolder over time"],
    "seasonalPatterns": ["Dark mode for winter campaigns"]
  },
  "successfulConcepts": [
    "Urban jungle - campaign X performed 340% above average",
    "Minimal brutalism - high engagement Q2"
  ],
  "avoidPatterns": ["Overly corporate tone underperformed"]
}
```

### 4. Creative Director Agent *(ENHANCED)*
- **Input:** Brief + Brand DNA + Historical Context
- **Output:**
```json
{
  "conceptoCentral": "Urban jungle evolution - from concrete to green",
  "directionJustification": "Builds on successful 'urban jungle' but evolves with brand's sustainable pivot",
  "paleta": {
    "base": "#1A1A1A",
    "evolution": "#2D5A27", // new sustainable green
    "accent": "#FF6B35"
  },
  "moodKeywords": ["evolved", "sustainable urban", "contraste orgánico"],
  "jerarquiaVisual": {
    "headline": "impacto máximo, Bebas Neue",
    "subhead": "supporting, Inter medium", 
    "cta": "accent color, alta visibilidad"
  }
}
```

### 5. Copywriter Agent
- **Input:** Brief + Brand DNA + Creative Concept + Historical tone
- **Output:** Copy optimizado por canal con tono consistency

### 6. Art Director Agent  
- **Input:** Brief + Brand + Concept + Copy
- **Output:** Prompts técnicos para Replicate con brand consistency

### 7. Image Generation Agent
- **Replicate integration** con Flux/Ideogram
- **Retry logic** y quality filtering
- **Brand color injection** en post-processing

### 8. Layout Composer Agent
- **Input:** Copy + Images + Brand DNA + Output specs
- **Output:** HTML/CSS production-ready
- **Templates:** por canal (IG 1080x1080, Story 1080x1920, FB 1200x630, etc.)

---

## Technical Implementation

### Tech Stack
```
Frontend: Next.js 15 + TypeScript + Tailwind
Backend: Next.js API Routes + Edge Functions
Database: Supabase (PostgreSQL + Storage)
AI: Claude API (Anthropic) + Replicate (image generation)
Render: Puppeteer/Playwright + @vercel/og
Deploy: Vercel
```

### API Structure
```
/api/
├── brands/
│   ├── create
│   ├── [brandId]/
│   │   ├── guidelines (CRUD)
│   │   └── campaigns
├── campaigns/
│   ├── create
│   ├── [campaignId]/
│   │   ├── generate
│   │   └── assets
└── agents/
    ├── brief-analyst
    ├── brand-analyzer  
    ├── brand-historian
    ├── creative-director
    ├── copywriter
    ├── art-director
    ├── image-generation
    └── layout-composer
```

---

## Implementation Roadmap

### Phase 0: Foundation ✅
- [x] Project setup (Next.js + types)
- [x] Design system implementation
- [x] Landing page architecture

### Phase 1: MVP Dashboard (Week 1)
- [ ] Landing con bifurcación (campaña rápida vs setup completo)
- [ ] Dashboard básico (crear marcas, listar campañas)
- [ ] Gestión de marca (CRUD + brand guidelines)
- [ ] Enhanced campaign wizard (con selección de marca)

### Phase 2: Agent System (Week 2)
- [ ] Implementar 8 agentes en secuencia
- [ ] API orchestration (/api/generate endpoint)
- [ ] Image generation pipeline (Replicate)
- [ ] HTML → PNG rendering (Puppeteer)

### Phase 3: Brand Memory (Week 3)
- [ ] Brand Historian agent
- [ ] Campaign metadata storage
- [ ] Historical analysis integration en Creative Director
- [ ] Brand guidelines versioning

### Phase 4: Production Polish (Week 4)
- [ ] Error handling & retry logic
- [ ] Cost estimation & billing integration
- [ ] Performance optimization
- [ ] User onboarding & tutorials

---

## Success Metrics

### MVP Validation
- [ ] Usuario puede crear marca en <3 minutos
- [ ] Campaña rápida genera 4 assets en <5 minutos
- [ ] Brand consistency score >85% (human evaluation)
- [ ] User retention: 40% return within 7 days

### Business Metrics
- [ ] Cost per generation <$3
- [ ] Monthly recurring users >100 (3 months post-launch)
- [ ] Average campaign value >$50 (enterprise accounts)

---

## Next Immediate Actions

1. **Implementar landing bifurcado** con los dos CTAs
2. **Crear dashboard básico** con gestión de marcas
3. **Enhanced wizard** con selección de marca opcional
4. **Primer agente funcional** (Brief Analyst) con test end-to-end

---

*Este documento será el single source of truth para todo el desarrollo. Actualizar con cada feature completada.*
