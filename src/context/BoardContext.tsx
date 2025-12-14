'use client';

import { apiClient } from '@/lib/api';
import { Board, Card, List } from '@/types';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface BoardContextType {
  boards: Board[];
  currentBoardId: string | null;
  loading: boolean;
  setCurrentBoardId: (id: string | null) => void;
  createBoard: (title: string, description: string, background: string) => Promise<Board>;
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  createList: (boardId: string, title: string) => Promise<List>;
  updateList: (listId: string, updates: Partial<List>) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  moveList: (boardId: string, fromIndex: number, toIndex: number) => void;
  createCard: (listId: string, title: string) => Promise<Card>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCard: (cardId: string, fromListId: string, toListId: string, toIndex: number) => Promise<void>;
  getCurrentBoard: () => Board | undefined;
  refreshBoards: () => Promise<void>;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load boards from API on mount
  const refreshBoards = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAllBoards();
      // Convert backend format (numeric IDs) to frontend format (string IDs)
      const formattedBoards = data.map((board: any) => {
        // If board has lists, format them
        const formattedLists = (board.lists || []).map((list: any) => ({
          ...list,
          id: list.id.toString(),
          boardId: board.id.toString(),
          cards: (list.cards || []).map((card: any) => ({
            ...card,
            id: card.id.toString(),
            listId: list.id.toString(),
          }))
        }));

        return {
          ...board,
          id: board.id.toString(),
          lists: formattedLists,
        };
      });
      setBoards(formattedBoards);
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBoards();
  }, []);

  const createBoard = async (title: string, description: string, background: string): Promise<Board> => {
    try {
      const newBoard = await apiClient.createBoard(title, description, background);
      const formatted = {
        ...newBoard,
        id: newBoard.id.toString(),
        lists: [],
      };
      setBoards((prev) => [...prev, formatted]);
      return formatted;
    } catch (error) {
      console.error('Failed to create board:', error);
      throw error;
    }
  };

  const updateBoard = async (id: string, updates: Partial<Board>) => {
    try {
      await apiClient.updateBoard(id, updates);
      setBoards((prev) =>
        prev.map((board) =>
          board.id === id ? { ...board, ...updates } : board
        )
      );
    } catch (error) {
      console.error('Failed to update board:', error);
      throw error;
    }
  };

  const deleteBoard = async (id: string) => {
    try {
      await apiClient.deleteBoard(id);
      setBoards((prev) => prev.filter((board) => board.id !== id));
      if (currentBoardId === id) {
        setCurrentBoardId(null);
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
      throw error;
    }
  };

  const createList = async (boardId: string, title: string): Promise<List> => {
    const board = boards.find((b) => b.id === boardId);
    if (!board) throw new Error('Board not found');

    try {
      const position = board.lists.length;
      const newList = await apiClient.createList(Number(boardId), title, position);
      const formatted = {
        ...newList,
        id: newList.id.toString(),
        boardId,
        cards: [],
      };

      setBoards((prev) =>
        prev.map((b) =>
          b.id === boardId
            ? { ...b, lists: [...b.lists, formatted] }
            : b
        )
      );

      return formatted;
    } catch (error) {
      console.error('Failed to create list:', error);
      throw error;
    }
  };

  const updateList = async (listId: string, updates: Partial<List>) => {
    try {
      await apiClient.updateList(Number(listId), updates);
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          lists: board.lists.map((list) =>
            list.id === listId ? { ...list, ...updates } : list
          ),
        }))
      );
    } catch (error) {
      console.error('Failed to update list:', error);
      throw error;
    }
  };

  const deleteList = async (listId: string) => {
    try {
      await apiClient.deleteList(Number(listId));
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          lists: board.lists.filter((list) => list.id !== listId),
        }))
      );
    } catch (error) {
      console.error('Failed to delete list:', error);
      throw error;
    }
  };

  const moveList = (boardId: string, fromIndex: number, toIndex: number) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id !== boardId) return board;

        const newLists = [...board.lists];
        const [movedList] = newLists.splice(fromIndex, 1);
        newLists.splice(toIndex, 0, movedList);

        // Update positions in backend for each list
        newLists.forEach((list, idx) => {
          if (list.position !== idx) {
            apiClient.updateList(Number(list.id), { position: idx }).catch(console.error);
          }
        });

        return {
          ...board,
          lists: newLists.map((list, idx) => ({ ...list, position: idx })),
        };
      })
    );
  };

  const createCard = async (listId: string, title: string): Promise<Card> => {
    const list = boards
      .flatMap((b) => b.lists)
      .find((l) => l.id === listId);
    
    if (!list) throw new Error('List not found');

    try {
      const position = list.cards.length;
      const newCard = await apiClient.createCard(Number(listId), title, '', position);
      const formatted = {
        ...newCard,
        id: newCard.id.toString(),
        listId,
      };

      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          lists: board.lists.map((l) => {
            if (l.id === listId) {
              return { ...l, cards: [...l.cards, formatted] };
            }
            return l;
          }),
        }))
      );

      return formatted;
    } catch (error) {
      console.error('Failed to create card:', error);
      throw error;
    }
  };

  const updateCard = async (cardId: string, updates: Partial<Card>) => {
    try {
      await apiClient.updateCard(Number(cardId), updates);
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          lists: board.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card.id === cardId ? { ...card, ...updates } : card
            ),
          })),
        }))
      );
    } catch (error) {
      console.error('Failed to update card:', error);
      throw error;
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      await apiClient.deleteCard(Number(cardId));
      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          lists: board.lists.map((list) => ({
            ...list,
            cards: list.cards.filter((card) => card.id !== cardId),
          })),
        }))
      );
    } catch (error) {
      console.error('Failed to delete card:', error);
      throw error;
    }
  };

  const moveCard = async (cardId: string, fromListId: string, toListId: string, toIndex: number) => {
    // Optimistic update
    let cardToMove: Card | null = null;

    setBoards((prev) =>
      prev.map((board) => {
        // Remove card from source list
        const listsAfterRemoval = board.lists.map((list) => {
          if (list.id === fromListId) {
            const cardIndex = list.cards.findIndex((c) => c.id === cardId);
            if (cardIndex !== -1) {
              cardToMove = { ...list.cards[cardIndex], listId: toListId };
              return {
                ...list,
                cards: list.cards.filter((c) => c.id !== cardId),
              };
            }
          }
          return list;
        });

        if (!cardToMove) return board;

        // Add card to destination list
        const finalLists = listsAfterRemoval.map((list) => {
          if (list.id === toListId) {
            const newCards = [...list.cards];
            newCards.splice(toIndex, 0, cardToMove!);
            return {
              ...list,
              cards: newCards.map((card, idx) => ({ ...card, position: idx })),
            };
          }
          return list;
        });

        return { ...board, lists: finalLists };
      })
    );

    // Sync with backend
    try {
      await apiClient.moveCard(Number(cardId), Number(toListId), toIndex);
    } catch (error) {
      console.error('Failed to move card:', error);
      // Revert on error by refreshing
      refreshBoards();
    }
  };

  const getCurrentBoard = () => {
    return boards.find((b) => b.id === currentBoardId);
  };

  return (
    <BoardContext.Provider
      value={{
        boards,
        currentBoardId,
        loading,
        setCurrentBoardId,
        createBoard,
        updateBoard,
        deleteBoard,
        createList,
        updateList,
        deleteList,
        moveList,
        createCard,
        updateCard,
        deleteCard,
        moveCard,
        getCurrentBoard,
        refreshBoards,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within BoardProvider');
  }
  return context;
}
