# Design Spec — Thai Movie Chatbot Frontend

**Date:** 2026-04-18  
**Project:** AI แนะนำหนังไทยจากรีวิว IMDb  
**Author:** แม็ก  
**Status:** Approved

---

## 1. Overview

React frontend สำหรับ chatbot น้องฟิล์ม ที่แนะนำภาพยนตร์ไทยโดยใช้ข้อมูลรีวิวจาก IMDb  
Backend ทำงานอยู่บน Hugging Face Spaces แล้ว — frontend เชื่อมต่อผ่าน Gradio Client API  
Deploy บน GitHub Pages

---

## 2. Architecture

```
React App (GitHub Pages)
    ↓ @gradio/client
HuggingFace Space: chat-ai-movies-imdb/imdb_chatbot
    → /generate_rag_response (message: string) → string
    ↓
TMDB API (client-side)
    → ดึง poster image ด้วย imdb_id จาก metadata
```

**Tech Stack:**
- React 18 + Vite
- `@gradio/client` — เรียก HF Spaces API
- `@tanstack/react-query` — จัดการ async state
- CSS Modules — styling (ไม่ใช้ Tailwind เพื่อให้ deploy บน GitHub Pages ง่าย)
- Vite `gh-pages` plugin — deploy

---

## 3. Color & Design System

### Palette
| Token | Value | ใช้ที่ |
|---|---|---|
| `--color-bg` | `#070707` | background หลัก |
| `--color-surface` | `#111111` | card, input background |
| `--color-border` | `#2a2500` | border ทั่วไป |
| `--color-gold` | `#f5c518` | accent หลัก (IMDb Gold) |
| `--color-gold-dim` | `#c9a000` | hover state |
| `--color-text` | `#ffffff` | text หลัก |
| `--color-text-muted` | `#888888` | placeholder, secondary text |
| `--color-bot-bubble` | `#1a1500` | กล่องข้อความ bot |
| `--color-bot-text` | `#e0d080` | ข้อความ bot |
| `--color-user-bubble` | `#f5c518` | กล่องข้อความ user |
| `--color-user-text` | `#000000` | ข้อความ user |

### Typography
- Font: system-ui, sans-serif
- Logo/heading: bold, letter-spacing 1px
- Chat bubble: 14px, line-height 1.6
- Tab/label: 11px

### Spacing
- Base unit: 8px
- Border radius: 8px (card), 20px (input/pill), 50% (send button)

---

## 4. Pages & States

### State 1 — Landing Page

```
┌─────────────────────────────────────────┐
│ 🎬 น้องฟิล์ม  [ทั้งหมด][ผี][ตลก][รัก][แอคชั่น]  │  ← Navbar
├─────────────────────────────────────────┤
│                                         │
│   🎞 🎞  [  🎞 FEATURED 🎞  ]  🎞 🎞   │  ← Poster Carousel
│                                         │
│          What's your taste?             │
│   ┌─────────────────────────────┐ [▶]  │  ← Input
│   └─────────────────────────────┘      │
└─────────────────────────────────────────┘
```

**Behavior:**
- Poster carousel แสดง 5 posters, center poster ใหญ่กว่าและมี gold border
- Genre tabs กรอง posters ที่แสดง (ใช้ข้อมูลจาก metadata.json ที่ฝังใน bundle)
- กด ← → หรือ scroll เลื่อน poster ได้
- พิมพ์แล้วกด Enter หรือปุ่ม ▶ → เปลี่ยนไป State 2

### State 2 — Chat Active

```
┌─────────────────────────────────────────┐
│ [🎞][🎞][🎞][🎞][🎞][🎞][🎞][🎞][🎞]   │  ← Poster strip (80px, shrunk)
├─────────────────────────────────────────┤
│ 🎬 น้องฟิล์ม: สวัสดีค่ะ!               │
│                          [user msg]     │
│ 🎬 น้องฟิล์ม: แนะนำ...                 │  ← Chat history (scrollable)
│                                         │
│ ──────────────────────────────────────  │
│   ┌─────────────────────────────┐ [▶]  │  ← Input (ยังอยู่)
└─────────────────────────────────────────┘
```

**Behavior:**
- Poster carousel หดเป็น horizontal strip ด้านบน (animation slide-up)
- Chat history scrollable, auto-scroll ไปล่างสุดเมื่อมีข้อความใหม่
- Bot message แสดง typing indicator (3 dots) ขณะรอ API
- ข้อความ bot render Markdown (**bold**, bullet list)

---

## 5. Components

| Component | หน้าที่ |
|---|---|
| `App` | root, จัดการ `chatActive` state |
| `Navbar` | logo + year tabs |
| `PosterCarousel` | fetch TMDB posters, แสดง 5 posters พร้อม center highlight |
| `PosterStrip` | แสดงตอน chat active (poster เรียงแนวนอน) |
| `ChatArea` | รายการข้อความทั้งหมด |
| `ChatMessage` | bubble เดี่ยว (bot/user), render markdown |
| `TypingIndicator` | 3-dot animation ขณะรอ |
| `ChatInput` | input box + send button, จัดการ submit |
| `useChat` | custom hook: ส่งข้อความ → เรียก HF API → เก็บ history |
| `useTMDB` | custom hook: fetch poster URLs จาก TMDB |

---

## 6. API Integration

### Hugging Face Spaces (Gradio)
```js
import { Client } from "@gradio/client";

const client = await Client.connect("chat-ai-movies-imdb/imdb_chatbot");
const result = await client.predict("/generate_rag_response", {
  message: userMessage
});
// result.data[0] → string (bot response)
```

**หมายเหตุ:** Space นี้อยู่ในโหมด Sleeping เมื่อไม่มีคนใช้ — ครั้งแรกอาจรอ 30-60 วินาที  
ให้แสดง loading message พิเศษ: "น้องฟิล์มกำลังตื่นนอน... รอแป๊บนึงนะคะ 🎬"

### TMDB API
```
GET https://api.themoviedb.org/3/find/{imdb_id}?external_source=imdb_id
Authorization: Bearer {TMDB_API_KEY}
→ ดึง poster_path แล้วใช้: https://image.tmdb.org/t/p/w300{poster_path}
```

**TMDB API Key:** เก็บใน `.env` เป็น `VITE_TMDB_API_KEY`  
(ไม่เป็น secret เพราะ TMDB key สำหรับ read-only public data ปลอดภัยที่จะ expose ใน frontend)

### Hardcoded Fallback Posters
กรณี TMDB หา poster ไม่เจอ ให้แสดง gradient placeholder พร้อมชื่อหนัง

---

## 7. Year Tabs

ใช้ `release_year` จาก metadata ที่มีอยู่แล้ว — ไม่ต้อง hardcode หรือ API เพิ่ม  
ตรงกับ ref design ที่ใช้ year range tabs (2025-2020, 2019-2015, ...)

| Tab | ช่วงปี |
|---|---|
| ทั้งหมด | ทุกเรื่อง |
| 2020s | release_year >= 2020 |
| 2010s | 2010 <= release_year < 2020 |
| 2000s | 2000 <= release_year < 2010 |
| ก่อน 2000 | release_year < 2000 |

**การทำงาน:** เมื่อคลิก tab → filter movies ใน carousel ตาม release_year → fetch TMDB poster ของ movies ที่ผ่าน filter

---

## 8. Project Structure

```
chat-bot/
├── frontend/                  ← React app (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PosterCarousel.jsx
│   │   │   ├── PosterStrip.jsx
│   │   │   ├── ChatArea.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── TypingIndicator.jsx
│   │   │   └── ChatInput.jsx
│   │   ├── hooks/
│   │   │   ├── useChat.js
│   │   │   └── useTMDB.js
│   │   ├── data/
│   │   │   └── movies.js      ← subset ของ metadata (title, imdb_id, release_year)
│   │   ├── styles/
│   │   │   └── variables.css  ← CSS custom properties (color tokens)
│   │   └── App.jsx
│   ├── .env                   ← VITE_TMDB_API_KEY=...
│   ├── vite.config.js
│   └── package.json
├── app.py                     ← Python backend (HF Spaces — ไม่แก้)
├── metadata.json
├── movie_vectors.index
└── requirements.txt
```

---

## 9. Deployment — GitHub Pages

```bash
# Build
npm run build

# Deploy (ใช้ gh-pages package)
npm run deploy
```

**vite.config.js:**
```js
export default { base: '/chat-bot/' }  // ชื่อ GitHub repo
```

**`.env` ใน local** — ไม่ push ขึ้น GitHub  
**GitHub Actions secret** `VITE_TMDB_API_KEY` — ใส่ใน repo Settings → Secrets

---

## 10. Out of Scope

- Chat history persistence (ไม่บันทึกหลังปิดหน้าต่าง)
- User authentication
- Mobile responsive (desktop-first สำหรับ presentation)
- Multiple language support
