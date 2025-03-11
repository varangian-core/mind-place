# MindPlace Keyboard Shortcuts

MindPlace provides several keyboard shortcuts to enhance your productivity:

## Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open fuzzy search modal |
| `Cmd/Ctrl + N` | Create new snippet |
| `Cmd/Ctrl + Shift + V` | Paste from clipboard to create new snippet |
| `Cmd/Ctrl + /` | Toggle keyboard shortcuts help panel |

## In Editor

| Shortcut | Action |
|----------|--------|
| `Tab` | Switch between Edit and Preview tabs |

## Tips

- Use fuzzy search to quickly find snippets by name or content
- Paste code directly from your clipboard to create a new snippet
- All snippets support Markdown formatting with code syntax highlighting
- When database connection is unavailable, snippets are stored in your browser's localStorage

## Storage

MindPlace can operate in two modes:
1. **Database Mode**: Snippets are stored in a PostgreSQL database (requires DATABASE_URL environment variable)
2. **Local Storage Mode**: When database connection fails, snippets are automatically stored in your browser's localStorage
   - Note: Local storage is browser-specific and will not sync between devices
