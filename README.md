# 🌀 MindPlace Snippet Manager

**MindPlace Snippet Manager** is a powerful, pastebin-like platform designed to help you create, manage, and share code snippets with rich Markdown formatting. It seamlessly integrates with Google Drive for storage and leverages a Postgres database for managing snippet metadata. With a polished UI built on Next.js 13 (App Router), Material UI, Tailwind CSS, and Prisma, you’ll enjoy a delightful and themeable coding experience.

## ✨ Features

- **Theming Options:**  
  Choose from **Light**, **Dark**, or **Synthwave** modes, directly from the sidebar. Instantly transform your interface’s look and feel.

- **Rich Markdown Support:**  
  Write snippets using full Markdown, including:
  - **Headings**, **bold**, *italic*, ***bold+italic*** text
  - [Links](https://example.com), images, blockquotes, and tables
  - Code blocks with syntax highlighting for multiple languages (e.g., ` ```java `, ` ```python `)
  
- **Enhanced Snippet Preview:**  
  Toggle between editing Markdown and previewing rendered HTML with syntax highlighting. Tables, code blocks, blockquotes, and images all look great.

- **Integrated Storage & Metadata:**  
  Store snippet files in Google Drive (optional) and maintain metadata (name, content, created date) in Postgres via Prisma.  
  Each snippet gets a unique URL: `/gist/{id}` for easy sharing.

- **Polished UI & Data Table:**  
  Enjoy a professional UI with gradients, animated SVG backgrounds, and rounded corners. The MUI DataGrid lists snippets with:
  - Name, URL link icon (opens in new tab)
  - Content preview on hover
  - Date created (formatted)
  - Icon indicating Drive storage

- **Modern Tech Stack:**  
  Built with [Next.js 13](https://nextjs.org/) (App Router), [Material UI](https://mui.com/), [Tailwind CSS](https://tailwindcss.com/), [Prisma](https://www.prisma.io/), and [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm).

## 🚀 Getting Started

1. **Clone the repo:**
   ```bash
  [ git clone https://github.com/yourusername/mindplace-snippet-manager.git](https://github.com/varangian-core/mind-place.git)
   cd mindplace-place
  ```
  
