# Martrello

A beautiful Trello clone built with Next.js, TypeScript, and Docker.

## Features

- ✨ Create and manage multiple boards
- 📋 Create lists within boards
- 🎯 Create and edit cards
- 🖱️ Drag and drop cards between lists
- 💾 LocalStorage persistence
- 🎨 Premium glassmorphism design
- 🐳 Docker support

## Getting Started

### With Docker (Recommended)

```bash
# Build and run the container
docker-compose up --build

# Access the app at http://localhost:3000
```

### Without Docker

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access the app at http://localhost:3000
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Drag & Drop**: @dnd-kit
- **State Management**: React Context
- **Containerization**: Docker

## MVP Features

- Create, edit, and delete boards
- Create, edit, and delete lists
- Create, edit, and delete cards
- Drag and drop cards within and between lists
- Inline editing for titles
- Card detail modal for descriptions
- localStorage for data persistence

## Project Structure

```
martrello/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── context/          # React Context for state
│   └── types/            # TypeScript interfaces
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## License

ISC
