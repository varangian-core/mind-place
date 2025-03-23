# MindPlace Installation and Usage

## Installation Options

### 1. Local Development (No Docker)

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure PostgreSQL database in `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
   ```
4. Run migrations:
   ```bash
   npm run migrate
   ```
5. Generate Prisma client:
   ```bash
   npm run generate
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

For local storage mode, simply start the server without configuring the database.

### 2. Docker Development

1. Clone the repository
2. Navigate to installation folder:
   ```bash
   cd installation
   ```
3. Start containers:
   ```bash
   docker-compose up
   ```
4. Access the app at: http://localhost:3000

### Configuration

Edit `installation/config.yaml` to customize:
- App port and host
- Storage mode (database or local)
- Theme preferences
- Database settings
- Local storage limits

The app will automatically:
- Use database when available
- Fallback to localStorage when database is unavailable
- Apply theme preferences
- Backup localStorage data periodically

## Keyboard Shortcuts

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
