# CreatorPulse

CreatorPulse is an AI-powered content creation platform built to help creators record, edit, and publish high-quality short-form videos from one place.

> **Project Status:** 🚧 Active Development (Pre-Beta)

---

# Vision

CreatorPulse aims to become an all-in-one platform for content creators by combining:

- Video Recording
- AI Editing
- Auto Captions
- Text Overlays
- Teleprompter
- Social Publishing
- AI Creator Tools

---

# Current MVP Focus

The current development is focused on delivering a stable MVP before adding advanced AI features.

## Recording

- Camera
- Flash
- Flip Camera
- Record Button
- Teleprompter

## Editing

- Auto Captions
- Text Overlay
- Font Selection
- Trim
- Split
- Cut
- Import Media
- Export Video

---

# Technology Stack

## Backend

- Node.js
- Express.js
- Supabase
- Google APIs
- RSS Parser

## Deployment

- Render

## Database

- Supabase PostgreSQL

## Authentication

- Supabase Auth

---

# Project Structure

```
creatorpulse/
│
├── public/
├── server.js
├── package.json
├── render.yaml
└── README.md
```

> The project is currently being refactored into a more modular architecture while keeping the application functional.

---

# Environment Variables

The project requires several environment variables to function correctly.

Examples include:

- PORT
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- NEWS_API_KEY
- GROQ_API_KEY
- HF_API_KEY
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
- ADMIN_KEY

These should be configured securely through Render Environment Variables and should never be committed to GitHub.

---

# Deployment

CreatorPulse is currently deployed using Render.

Deployment is managed through:

- render.yaml
- GitHub Repository
- Render Environment Variables

---

# Security

CreatorPulse follows these principles:

- Never commit secrets to GitHub.
- Store sensitive keys in Render Environment Variables.
- Use Supabase Authentication.
- Apply Row Level Security (RLS) where appropriate.
- Restrict admin operations to authorized users only.

---

# Development Roadmap

## Phase 1
- Stabilize backend
- Improve security
- Review Supabase
- Improve deployment
- Repository cleanup

## Phase 2
- Backend refactor
- API improvements
- Authentication improvements

## Phase 3
- Recorder improvements
- Editor improvements
- Media handling

## Phase 4
- Beta testing
- Performance optimization
- Bug fixing

## Phase 5
- Public launch

---

# License

Copyright © CreatorPulse.

All rights reserved.

---

# Maintainer

CreatorPulse Development Team

Lead Developer:
Alleq2th
