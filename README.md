# Nexus of Thought: A Digital Research Garden

Nexus of Thought is a high-performance, minimalist digital garden and technical blog designed for researchers, engineers, and mathematical thinkers. It focuses on clarity, archival quality, and the seamless integration of mathematical notation with deep-dive technical writing.

## 🎨 The Theme Idea

The design philosophy is centered around **"Archival Minimalism"** and **"Swiss Typography"**.

- **Typography First**: Uses modern sans-serif headers (Inter) paired with elegant, highly readable serif body text for long-form reading.
- **Mathematical First-Class Citizen**: Built-in support for LaTeX via KaTeX, ensuring equations are beautifully rendered and readable.
- **Obsidain-Inspired**: Features a "backlinks" system that mimics personal knowledge management tools like Obsidian or Roam Research, allowing readers to see how different research notes are interconnected.
- **Minimalist Palette**: A clean, light-filled interface (high-contrast white background with deep grey text) that avoids distractions, focusing entirely on the content.

## 🚀 Key Features

- **Markdown-Driven**: All content is written in standard Markdown files stored in the `/content` directory.
- **Mathematical Rendering**: Full support for inline `$x=y$` and display-mode `$$E=mc^2$$` mathematics.
- **Automatic Backlinks**: The system scans your content to find mentions of other posts, creating a web of related thoughts at the bottom of every page.
- **Searchable Taxonomy**: Fully searchable by title, summary, or keyword tags.
- **Responsive Navigation**: A persistent archival sidebar for desktop and a nimble mobile menu for tablet and phone exploration.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4.
- **Backend/API**: Express.js (Node.js) acting as a content server.
- **Animations**: Motion (f.k.a. Framer Motion).
- **Markdown Processing**: `react-markdown` with `remark-math` and `rehype-katex`.
- **Infrastructure**: Configured for Cloud Run/containerized deployment.

## 📁 File Structure

- `/content`: Where your `.md` research notes live.
- `/src/views`: Page-level components (Home, Post, Essays, Tags).
- `/src/components`: UI primitives (Sidebar, PostCard, Markdown components).
- `server.ts`: The Express backend that manages file system interactions and post caching.

## 💻 Local Development

To run this project locally on your machine:

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed.

### 2. Installation
Clone the repository (or download the source) and run:
```bash
npm install
```

### 3. Run the Live Server
Start the development server with:
```bash
npm run dev
```
This boots up the Express backend and the Vite frontend simultaneously. The app will be available at `http://localhost:3000`.

### 4. Build for Production
To generate a production-ready bundle:
```bash
npm run build
```
This will compile the frontend to `/dist` and bundle the server into a single file at `/dist/server.cjs`.

## ✍️ Updating Content

**Adding a Post:**
1. Create a new `.md` file in the `/content` folder.
2. Add the required frontmatter at the top:
   ```markdown
   ---
   title: "Your Thinking Title"
   date: "2024-05-18"
   summary: "A brief summary of what this research covers."
   tags: ["Math", "AI", "Note"]
   ---
   ```
3. Write your content using standard Markdown and LaTeX.

**Modifying the UI:**
- The global theme is controlled via Tailwind classes in `src/index.css` and individual components.
- The site name and description can be updated in `metadata.json`.

---

*Nexus of Thought was built to turn raw research into a polished, interconnected archival experience.*
