# 🌙 Ramadan Persona Generator
**AI-Driven B2B2C Engagement Engine powered by Alibaba Cloud Qwen**

![Alibaba Cloud](https://img.shields.io/badge/Alibaba_Cloud-DashScope-orange?style=for-the-badge&logo=alibabacloud)
![Qwen Model](https://img.shields.io/badge/Model-Qwen_Plus-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Backend-Node.js_&_Express-success?style=for-the-badge&logo=nodedotjs)
![TailwindCSS](https://img.shields.io/badge/Frontend-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

## 📌 Project Overview
**Ramadan Persona Generator** is a dynamic, hyper-personalized AI web application built for the **Alibaba Cloud AI Hackathon**. 

Beyond a simple quiz, this project serves as a prototype for a **B2B2C Engagement Engine**. It solves the problem of stagnant Ramadan marketing campaigns by utilizing the "Barnum Effect" and Gen-Z copywriting to generate highly relatable, shareable user personas. 

### ✨ Core Features
- **Dynamic Quiz Generation**: AI generates 5 unique Ramadan trivia questions based on the user's selected tone ("Receh Gen-Z" or "Kalem & Bijak").
- **Hyper-Personalized Persona**: Evaluates user scores to generate custom archetypes (e.g., *Tarawih Warrior*, *Sultan Takjil*), complete with Superpowers, Weaknesses, and Advice.
- **AI Roasting & POV Memes**: Delivers highly contextual humor tailored to the user's performance.
- **Frictionless Viral Loop (1-Click Export)**: Integrated `html2canvas` allows users to instantly download their results as HD images optimized for Instagram/WhatsApp Stories.

---

## 🏗️ Technical Architecture & Tech Stack

### 1. Frontend (Client-Side)
- **HTML5 & Vanilla JavaScript**: Lightweight and fast execution.
- **Tailwind CSS**: Modern glassmorphism UI with responsive design.
- **html2canvas**: Client-side rendering for image exportation.

### 2. Backend (Proxy Server)
- **Node.js & Express.js**: Acts as a secure middleware layer. 
- **Security Compliance**: The backend proxy pattern is intentionally designed to **hide the DashScope API Key** from the client-side network payload, ensuring production-grade security.

### 3. AI Engine (Alibaba Cloud)
- **Service**: Alibaba Cloud DashScope (International Endpoint).
- **Model**: `qwen-plus`.
- **Integration**: OpenAI-compatible format (`/compatible-mode/v1/chat/completions`) utilizing a highly optimized **Single Payload Architecture** to reduce latency by combining Persona and Meme generation into one prompt.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- Alibaba Cloud DashScope API Key
