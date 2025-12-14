import { Board, BoardWithLists, Card, List } from '../types';
import { dbAll, dbGet, dbRun } from './database';

// ============ BOARDS ============

export const getAllBoards = async (): Promise<BoardWithLists[]> => {
  const boards = await dbAll<Board>('SELECT * FROM boards ORDER BY created_at DESC');
  
  // Fetch lists and cards for each board
  const boardsWithLists = await Promise.all(
    boards.map(async (board) => {
      const lists = await getListsByBoardId(board.id);
      const listsWithCards = await Promise.all(
        lists.map(async (list) => ({
          ...list,
          cards: await getCardsByListId(list.id)
        }))
      );
      
      return {
        ...board,
        lists: listsWithCards
      };
    })
  );
  
  return boardsWithLists;
};

export const getBoardById = async (id: number): Promise<BoardWithLists | null> => {
  const board = await dbGet<Board>('SELECT * FROM boards WHERE id = ?', [id]);
  
  if (!board) return null;
  
  const lists = await getListsByBoardId(id);
  const listsWithCards = await Promise.all(
    lists.map(async (list) => ({
      ...list,
      cards: await getCardsByListId(list.id)
    }))
  );
  
  return {
    ...board,
    lists: listsWithCards
  };
};

export const createBoard = async (title: string, description: string, background: string): Promise<Board> => {
  return new Promise((resolve, reject) => {
    import('sqlite3').then(({ default: sqlite3 }) => {
      import('./database').then(({ default: db }) => {
        db.run(
          'INSERT INTO boards (title, description, background) VALUES (?, ?, ?)',
          [title, description, background],
          function (err) {
            if (err) {
              reject(err);
            } else {
              dbGet<Board>('SELECT * FROM boards WHERE id = ?', [this.lastID])
                .then(board => resolve(board!))
                .catch(reject);
            }
          }
        );
      });
    });
  });
};

export const updateBoard = async (id: number, title?: string, description?: string, background?: string): Promise<Board | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (background !== undefined) {
    updates.push('background = ?');
    values.push(background);
  }
  
  if (updates.length === 0) {
    return await dbGet<Board>('SELECT * FROM boards WHERE id = ?', [id]) || null;
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  await dbRun(`UPDATE boards SET ${updates.join(', ')} WHERE id = ?`, values);
  
  return await dbGet<Board>('SELECT * FROM boards WHERE id = ?', [id]) || null;
};

export const deleteBoard = async (id: number): Promise<boolean> => {
  await dbRun('DELETE FROM boards WHERE id = ?', [id]);
  return true;
};

// ============ LISTS ============

export const getListsByBoardId = async (boardId: number): Promise<List[]> => {
  return await dbAll<List>('SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC', [boardId]);
};

export const createList = async (boardId: number, title: string, position: number): Promise<List> => {
  return new Promise((resolve, reject) => {
    import('./database').then(({ default: db }) => {
      db.run(
        'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
        [boardId, title, position],
        function (err) {
          if (err) {
            reject(err);
          } else {
            dbGet<List>('SELECT * FROM lists WHERE id = ?', [this.lastID])
              .then(list => resolve(list!))
              .catch(reject);
          }
        }
      );
    });
  });
};

export const updateList = async (id: number, title?: string, position?: number): Promise<List | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }
  if (position !== undefined) {
    updates.push('position = ?');
    values.push(position);
  }
  
  if (updates.length === 0) {
    return await dbGet<List>('SELECT * FROM lists WHERE id = ?', [id]) || null;
  }
  
  values.push(id);
  
  await dbRun(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`, values);
  
  return await dbGet<List>('SELECT * FROM lists WHERE id = ?', [id]) || null;
};

export const deleteList = async (id: number): Promise<boolean> => {
  await dbRun('DELETE FROM lists WHERE id = ?', [id]);
  return true;
};

// ============ CARDS ============

export const getCardsByListId = async (listId: number): Promise<Card[]> => {
  return await dbAll<Card>('SELECT * FROM cards WHERE list_id = ? ORDER BY position ASC', [listId]);
};

export const getCardById = async (id: number): Promise<Card | null> => {
  return await dbGet<Card>('SELECT * FROM cards WHERE id = ?', [id]) || null;
};

export const createCard = async (listId: number, title: string, description: string, position: number): Promise<Card> => {
  return new Promise((resolve, reject) => {
    import('./database').then(({ default: db }) => {
      db.run(
        'INSERT INTO cards (list_id, title, description, position) VALUES (?, ?, ?, ?)',
        [listId, title, description, position],
        function (err) {
          if (err) {
            reject(err);
          } else {
            dbGet<Card>('SELECT * FROM cards WHERE id = ?', [this.lastID])
              .then(card => resolve(card!))
              .catch(reject);
          }
        }
      );
    });
  });
};

export const updateCard = async (id: number, title?: string, description?: string, position?: number, listId?: number): Promise<Card | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (position !== undefined) {
    updates.push('position = ?');
    values.push(position);
  }
  if (listId !== undefined) {
    updates.push('list_id = ?');
    values.push(listId);
  }
  
  if (updates.length === 0) {
    return await dbGet<Card>('SELECT * FROM cards WHERE id = ?', [id]) || null;
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  await dbRun(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`, values);
  
  return await dbGet<Card>('SELECT * FROM cards WHERE id = ?', [id]) || null;
};

export const deleteCard = async (id: number): Promise<boolean> => {
  await dbRun('DELETE FROM cards WHERE id = ?', [id]);
  return true;
};

export const moveCard = async (cardId: number, newListId: number, newPosition: number): Promise<Card | null> => {
  return await updateCard(cardId, undefined, undefined, newPosition, newListId);
};
