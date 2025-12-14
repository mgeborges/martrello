import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/martrello.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database with promise wrapper
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log(`✅ Database initialized at: ${dbPath}`);
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Initialize schema
    initializeSchema();
  }
});

// Promisify database methods
export const dbRun = (sql: string, params: any[] = []): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const dbGet = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
};

export const dbAll = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows || []) as T[]);
    });
  });
};

function initializeSchema() {
  const schema = `
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      background TEXT DEFAULT 'var(--gradient-primary)',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
    CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
    CREATE INDEX IF NOT EXISTS idx_lists_position ON lists(board_id, position);
    CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(list_id, position);
  `;

  db.exec(schema, (err) => {
    if (err) {
      console.error('Error creating schema:', err);
    } else {
      console.log('✅ Database schema initialized');
      insertSampleData();
    }
  });
}

function insertSampleData() {
  db.get('SELECT COUNT(*) as count FROM boards', (err, row: any) => {
    if (err) {
      console.error('Error checking boards:', err);
      return;
    }

    if (row.count === 0) {
      console.log('📝 Inserting sample data...');

      db.run(
        'INSERT INTO boards (title, description, background) VALUES (?, ?, ?)',
        ['Welcome to Martrello! 🚀', 'Your awesome Trello clone with backend!', 'var(--gradient-primary)'],
        function (err) {
          if (err) {
            console.error('Error inserting board:', err);
            return;
          }

          const boardId = this.lastID;

          db.run('INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)', [boardId, 'To Do', 0], function (err) {
            if (!err) {
              const list1Id = this.lastID;
              db.run('INSERT INTO cards (list_id, title, description, position) VALUES (?, ?, ?, ?)',
                [list1Id, 'Create your first card', 'Click on a card to edit its details!', 0]);
              db.run('INSERT INTO cards (list_id, title, description, position) VALUES (?, ?, ?, ?)',
                [list1Id, 'Drag cards between lists', 'Try dragging this card to another list', 1]);
            }
          });

          db.run('INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)', [boardId, 'In Progress', 1], function (err) {
            if (!err) {
              const list2Id = this.lastID;
              db.run('INSERT INTO cards (list_id, title, description, position) VALUES (?, ?, ?, ?)',
                [list2Id, 'Add new lists', 'Click "Add another list" to create more columns', 0]);
            }
          });

          db.run('INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)', [boardId, 'Done', 2], () => {
            console.log('✅ Sample data inserted successfully!');
          });
        }
      );
    }
  });
}

export default db;
