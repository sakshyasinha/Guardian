# 🛡️ Guardian
### Self-Healing Execution Copilot

> **Recovery over reminders.**
>
> Guardian doesn't remind you after you've already fallen behind.
> It quietly detects schedule risk, rebuilds your plan, and protects your deadlines before they collapse.

---

# Why Guardian?

Most productivity apps assume you'll follow your plan perfectly.

Real life doesn't.

You get distracted.
Meetings appear.
Classes run longer.
Motivation drops.

Most planners simply turn overdue tasks red.

Guardian does something different.

Instead of reminding you that you're behind, it automatically prepares a recovery strategy that keeps your deadline achievable.

That's why Guardian is a **Self-Healing Execution Copilot**.

---

# ✨ Core Features

## 🛡️ Recovery Engine

When your schedule becomes unrealistic, Guardian automatically:

- detects deadline risk
- analyzes remaining workload
- identifies critical milestones
- moves non-critical work
- inserts recovery buffers
- rebuilds your execution plan

No manual rescheduling.

---

## 🤖 Guardian Analysis

Every recovery includes an explanation.

Instead of saying

> "Schedule optimized."

Guardian explains:

- what changed
- why it changed
- what stayed fixed
- why the deadline remains protected

Transparent AI instead of black-box decisions.

---

## 📅 Adaptive Timeline

Guardian continuously maintains

- Today's Focus
- Execution Queue
- Tomorrow's Queue
- Recovery Buffers

Your schedule evolves instead of becoming outdated.

---

## 🎯 AI Goal Planning

Describe your goal naturally.

Example:

> "Prepare for my DBMS exam next Saturday."

Guardian generates:

- milestones
- work estimates
- execution order
- daily schedule
- AI starter guides

using Google Gemini.

---

## ⚡ Focus Blocks

Every milestone contains

- recommended work duration
- execution interval
- checklist
- why the task matters
- progress tracking

Designed to reduce decision fatigue.

---

## 👁 Guardian Presence

Guardian behaves like a quiet digital companion.

Instead of constant notifications:

- calmly watches your schedule
- intervenes only when needed
- explains recovery
- retreats into the background

Inspired by Calm Technology principles.

---

# 🏗 Architecture

```
User Goal
      │
      ▼
 Gemini Planning
      │
      ▼
 Milestone Generation
      │
      ▼
 Timeline Scheduler
      │
      ▼
 Execution Tracking
      │
      ▼
 Blocker Detection
      │
      ▼
 Recovery Engine
      │
      ▼
 Updated Timeline
```

---

# 🛠 Tech Stack

### Frontend

- React 19
- TypeScript
- Tailwind CSS v4
- Motion
- Lucide Icons

### Backend

- Node.js
- Express

### AI

- Google Gemini
- Google GenAI SDK

### Build

- Vite
- ESBuild

---

# 📂 Project Structure

```
src/
│
├── components/
├── store/
├── lib/
├── hooks/
├── types/
│
server.ts
package.json
```

---

# 🚀 Getting Started

## Clone

```bash
git clone https://github.com/<username>/Guardian.git
```

## Install

```bash
npm install
```

## Environment

```env
GEMINI_API_KEY=YOUR_KEY
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

---

# 🧠 Design Philosophy

Guardian follows one principle:

> **Recovery over reminders.**

Instead of telling users they failed, Guardian adapts the schedule so they can still succeed.

The interface is intentionally calm:

- minimal visual noise
- transparent AI reasoning
- muted colors
- structured focus
- recovery-first interactions

Technology should reduce stress, not create more of it.

---

# 🔮 Future Improvements

- Google Calendar synchronization
- Mobile companion
- Team planning
- Learning pattern adaptation
- Cross-device synchronization
- Personalized workload prediction

---

# 📜 License

Apache-2.0

---

## Built for Vibe2Ship Hackathon

Guardian explores a different future for productivity software—

one where software doesn't simply organize work.

It quietly protects your ability to finish it.
