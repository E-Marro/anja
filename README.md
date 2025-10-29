# Scheidungsrecht-DB 🇨🇭

**Schweizer Scheidungsurteile RAG-System mit Claude AI**

Ein professionelles Retrieval Augmented Generation (RAG) System zur Suche, Analyse und Abfrage von Schweizer Scheidungsurteilen. Entwickelt mit TypeScript, React und Claude AI.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

---

## ✨ Features

### 🔍 **Intelligente Urteilssuche**
- Volltext-Suche mit fortgeschrittener Filterung
- Filter nach Themen-Tags (Scheidung, Sorgerecht, Kindesunterhalt, etc.)
- Datumsbereich-Filter
- Gerichtsfilter (Bundesgericht, BGE)
- Echtzeit-Suchergebnisse

### 💬 **RAG-basierter Chat**
- Nutzt Claude AI für kontextbezogene Antworten
- TF-IDF-basierte Relevanz-Bewertung
- Automatisches Zitieren von Quellen
- Konversations-History
- Kontextbewusste Antworten basierend auf Urteilen

### 📊 **Statistiken & Analytics**
- Übersicht über geladene Urteile
- Tag-Verteilung
- Gerichts-Verteilung
- Zeitspannen-Analyse
- Chat-Statistiken

### 📁 **Datei-Import**
- Drag & Drop JSONL-Import
- Unterstützung für große Dateien (mit Split-Funktionalität)
- Automatische Daten-Validierung
- Progress-Tracking

---

## 🚀 Getting Started

### Voraussetzungen

- **Node.js** >= 18.x
- **npm** oder **yarn**
- **Claude API-Key** (von Anthropic)

### Installation

```bash
# Repository klonen
git clone https://github.com/E-Marro/anja.git
cd anja

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Die App läuft dann auf `http://localhost:5173`

### Build für Production

```bash
# TypeScript type-check
npm run type-check

# Production Build
npm run build

# Preview Production Build
npm run preview
```

---

## 📂 Projekt-Struktur

```
anja/
├── src/
│   ├── components/          # React-Komponenten
│   │   ├── SearchTab.tsx    # Urteilssuche
│   │   ├── ChatTab.tsx      # RAG-Chat
│   │   ├── UploadTab.tsx    # Datei-Import
│   │   └── StatsTab.tsx     # Statistiken
│   ├── services/            # Service-Layer
│   │   ├── claudeService.ts # Claude API Integration
│   │   ├── ragService.ts    # RAG-Logik (TF-IDF)
│   │   └── storageService.ts # Browser Storage
│   ├── types/               # TypeScript Typen
│   │   └── index.ts
│   ├── utils/               # Utility-Funktionen
│   │   ├── fileProcessor.ts # JSONL-Verarbeitung
│   │   └── formatter.ts     # Formatierungs-Utils
│   ├── hooks/               # Custom React Hooks
│   │   └── useFileUpload.ts
│   ├── App.tsx              # Haupt-App-Komponente
│   ├── main.tsx             # Entry Point
│   └── index.css            # Global Styles
├── index.html               # HTML Template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🗄️ Daten-Format

Das System benötigt JSONL-Dateien im folgenden Format:

### `index_master.jsonl`

```json
{
  "id": "5A_123_2020",
  "signatur": "5A_123/2020",
  "title": "Scheidung; Kindesunterhalt",
  "date": "2020-03-15",
  "court": "BGer",
  "tags": ["Scheidung", "Kindesunterhalt"],
  "chunks_count": 42
}
```

### `chunks_by_signatur.jsonl`

```json
{
  "signatur": "5A_123/2020",
  "chunks": [
    {
      "id": "5A_123_2020_0",
      "signatur": "5A_123/2020",
      "chunk_index": 0,
      "text": "Urteilstext..."
    }
  ]
}
```

### Große Dateien aufteilen

Für Dateien > 50 MB:

```bash
# Datei aufteilen (5000 Zeilen pro Teil)
split -l 5000 chunks_master.jsonl chunks_part_

# Upload: chunks_part_aa, chunks_part_ab, chunks_part_ac, ...
```

---

## 🔧 Konfiguration

### Claude API-Key

Der API-Key wird zur Laufzeit benötigt. Du kannst ihn:

1. **Im Code setzen** (für Development):
   ```typescript
   // In src/App.tsx
   useEffect(() => {
     claudeService.setApiKey('dein-api-key-hier');
   }, []);
   ```

2. **Via Environment Variable** (empfohlen):
   ```bash
   # .env.local erstellen
   VITE_CLAUDE_API_KEY=dein-api-key-hier
   ```

   ```typescript
   // In src/App.tsx
   claudeService.setApiKey(import.meta.env.VITE_CLAUDE_API_KEY);
   ```

### Vite Konfiguration

Die `vite.config.ts` ist für GitHub Pages konfiguriert:

```typescript
export default defineConfig({
  base: '/anja/',  // Ändere dies für dein Repository
  // ...
});
```

---

## 🎨 Customization

### Farben ändern

Bearbeite `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'anja-red': {
        // Deine Farben hier
      }
    }
  }
}
```

### Tags anpassen

In `src/App.tsx`:

```typescript
const AVAILABLE_TAGS = [
  'Scheidung',
  'Sorgerecht',
  'Kindesunterhalt',
  // Weitere Tags...
];
```

---

## 🧪 RAG-System Details

### TF-IDF Scoring

Das System verwendet Term Frequency-Inverse Document Frequency zur Relevanz-Bewertung:

```typescript
score = Σ(tf(term) × idf(term))
```

- **TF (Term Frequency)**: Wie oft kommt der Begriff im Dokument vor?
- **IDF (Inverse Document Frequency)**: Wie selten ist der Begriff im gesamten Korpus?

### Bonus-Scoring

- **Titel-Match**: +2.0
- **Tag-Match**: +1.5
- **Signatur-Match**: +1.0

### Context Building

- Top 5 relevanteste Urteile
- Max. 2500 Zeichen Kontext
- Automatische Quellen-Extraktion

---

## 🚢 Deployment

### GitHub Pages

1. **GitHub Actions Workflow** erstellen (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v2
        id: deployment
```

2. **GitHub Pages aktivieren**: Settings → Pages → Source: GitHub Actions

### Andere Plattformen

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy --prod`
- **Docker**: Dockerfile beigefügt (siehe unten)

---

## 🐳 Docker

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build & Run:

```bash
docker build -t scheidungsrecht-rag .
docker run -p 8080:80 scheidungsrecht-rag
```

---

## 🤝 Contributing

Contributions sind willkommen! Bitte:

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

---

## 📝 License

Dieses Projekt ist unter der MIT License lizenziert - siehe [LICENSE](LICENSE) für Details.

---

## 👥 Autoren

- **E-Marro** - Initial work

---

## 🙏 Acknowledgments

- **Anthropic** für Claude AI API
- **Schweizer Bundesgericht** für öffentliche Urteile
- **React**, **TypeScript**, **Vite**, **Tailwind CSS** Communities

---

## 📧 Kontakt

Bei Fragen oder Problemen, bitte ein Issue öffnen oder kontaktiere uns direkt.

---

**⚖️ Hinweis**: Dieses System dient der Recherche und Information. Für rechtliche Beratung konsultiere bitte einen Anwalt.
