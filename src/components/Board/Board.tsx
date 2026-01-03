'use client';

import Card from '@/components/Card/Card';
import List from '@/components/List/List';
import { useBoardContext } from '@/context/BoardContext';
import { Board as BoardType } from '@/types';
import {
    closestCorners,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import Link from 'next/link';
import React, { memo, useState } from 'react';
import styles from './Board.module.css';

const MemoizedList = memo(List);

interface BoardProps {
  board: BoardType;
}

export default function Board({ board }: BoardProps) {
  const { updateBoard, createList, moveCard, moveList } = useBoardContext();
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [localBoard, setLocalBoard] = useState<BoardType>(board);
  const [boardTitle, setBoardTitle] = useState(board.title);
  const [activeCard, setActiveCard] = useState<any>(null);

  // Sync local board when prop changes, but NOT while dragging
  React.useEffect(() => {
    if (!activeCard) {
      setLocalBoard(board);
      setBoardTitle(board.title);
    }
  }, [board, activeCard]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleTitleBlur = async () => {
    if (boardTitle.trim() && boardTitle !== board.title) {
      try {
        await updateBoard(board.id, { title: boardTitle.trim() });
      } catch (error) {
        console.error('Failed to update board:', error);
        setBoardTitle(board.title);
      }
    } else {
      setBoardTitle(board.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setBoardTitle(board.title);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleAddList = async () => {
    if (newListTitle.trim()) {
      try {
        await createList(board.id, newListTitle.trim());
        setNewListTitle('');
        setIsAddingList(false);
      } catch (error) {
        console.error('Failed to create list:', error);
        alert('Failed to create list. Please try again.');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddList();
    } else if (e.key === 'Escape') {
      setIsAddingList(false);
      setNewListTitle('');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = localBoard.lists
      .flatMap(list => list.cards)
      .find(c => c.id === active.id);
    
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Is it a card we're dragging?
    const isActiveACard = localBoard.lists.some((list) => list.cards.some((c) => c.id === activeId));
    if (!isActiveACard) return;

    setLocalBoard((prev) => {
      const activeList = prev.lists.find((l) => l.cards.some((c) => c.id === activeId));
      let targetList = prev.lists.find((l) => l.id === overId);
      if (!targetList) {
        targetList = prev.lists.find((l) => l.cards.some((c) => c.id === overId));
      }

      if (!activeList || !targetList || activeList.id === targetList.id) {
        return prev;
      }

      const activeListIndex = prev.lists.findIndex((l) => l.id === activeList.id);
      const targetListIndex = prev.lists.findIndex((l) => l.id === targetList.id);

      const activeCards = [...prev.lists[activeListIndex].cards];
      const targetCards = [...prev.lists[targetListIndex].cards];

      const activeCardIndex = activeCards.findIndex((c) => c.id === activeId);
      if (activeCardIndex === -1) return prev;

      const [movedCard] = activeCards.splice(activeCardIndex, 1);
      const updatedCard = { ...movedCard, listId: targetList.id };

      const overCardIndex = targetCards.findIndex((c) => c.id === overId);
      const newIndex = overCardIndex !== -1 ? overCardIndex : targetCards.length;

      targetCards.splice(newIndex, 0, updatedCard);

      const newLists = [...prev.lists];
      newLists[activeListIndex] = { ...prev.lists[activeListIndex], cards: activeCards };
      newLists[targetListIndex] = { ...prev.lists[targetListIndex], cards: targetCards };

      return { ...prev, lists: newLists };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const dragCardId = activeCard?.id;
    setActiveCard(null);

    if (!over) {
      setLocalBoard(board);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // List reordering
    if (localBoard.lists.some((l) => l.id === activeId)) {
      if (activeId !== overId) {
        const oldIndex = board.lists.findIndex((l) => l.id === activeId);
        const newIndex = board.lists.findIndex((l) => l.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          moveList(board.id, oldIndex, newIndex);
        }
      }
      return;
    }

    // Card reordering / movement
    if (dragCardId) {
      const sourceListOriginal = board.lists.find((l) => l.cards.some((c) => c.id === dragCardId));
      const targetListCurrent = localBoard.lists.find((l) => l.cards.some((c) => c.id === dragCardId));
      
      if (!targetListCurrent) return;

      const newIndex = targetListCurrent.cards.findIndex((c) => c.id === dragCardId);
      
      // Check if position actually changed
      const originalIndex = sourceListOriginal?.cards.findIndex(c => c.id === dragCardId);
      if (sourceListOriginal?.id === targetListCurrent.id && originalIndex === newIndex) {
        return;
      }

      await moveCard(dragCardId, sourceListOriginal?.id || targetListCurrent.id, targetListCurrent.id, newIndex);
    }
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    setLocalBoard(board);
  };

  return (
    <div className={styles.boardContainer}>
      <div className={styles.boardHeader}>
        <div className={styles.boardTitleContainer}>
          <img src="/logo.png" alt="Martrello" className={styles.logo} />
          <input
            className={styles.boardTitle}
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
          />
        </div>
        <Link href="/" className={styles.backLink}>
          ← Back to Boards
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className={styles.listsContainer}>
          <SortableContext
            items={localBoard.lists.map(l => l.id)}
            strategy={horizontalListSortingStrategy}
          >
            {localBoard.lists.map((list) => (
              <MemoizedList key={list.id} list={list} />
            ))}
          </SortableContext>

          <div className={styles.addListContainer}>
            {isAddingList ? (
              <div className={styles.addListForm}>
                <input
                  className={styles.addListInput}
                  placeholder="Enter list title..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <div className={styles.addListActions}>
                  <button className={styles.addListBtn} onClick={handleAddList} title="Add list">
                    ✓
                  </button>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListTitle('');
                    }}
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={styles.showAddListBtn}
                onClick={() => setIsAddingList(true)}
              >
                <span>+</span> Add another list
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <Card card={activeCard} onOpenModal={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
