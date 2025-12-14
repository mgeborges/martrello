'use client';

import Card from '@/components/Card/Card';
import List from '@/components/List/List';
import { useBoardContext } from '@/context/BoardContext';
import { Board as BoardType, Card as CardType } from '@/types';
import {
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
import React, { useState } from 'react';
import styles from './Board.module.css';

interface BoardProps {
  board: BoardType;
}

export default function Board({ board }: BoardProps) {
  const { updateBoard, createList, moveCard } = useBoardContext();
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [boardTitle, setBoardTitle] = useState(board.title);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

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
    const card = board.lists
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

    // Find source list
    const activeList = board.lists.find(list =>
      list.cards.some(card => card.id === activeId)
    );

    // Determine target list
    let targetList = board.lists.find(list => list.id === overId);
    if (!targetList) {
      targetList = board.lists.find(list =>
        list.cards.some(card => card.id === overId)
      );
    }

    if (!activeList || !targetList) return;
    if (activeList.id === targetList.id) return;

    // Move card to different list
    const activeCardIndex = activeList.cards.findIndex(c => c.id === activeId);
    moveCard(activeId, activeList.id, targetList.id, targetList.cards.length);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find the list containing the active card
    const activeList = board.lists.find(list =>
      list.cards.some(card => card.id === activeId)
    );

    // Find the list containing the over card
    const overList = board.lists.find(list =>
      list.cards.some(card => card.id === overId)
    );

    if (!activeList) return;

    // If dropping on the same list, reorder
    if (overList && activeList.id === overList.id) {
      const oldIndex = activeList.cards.findIndex(c => c.id === activeId);
      const newIndex = activeList.cards.findIndex(c => c.id === overId);
      
      if (oldIndex !== newIndex) {
        moveCard(activeId, activeList.id, activeList.id, newIndex);
      }
    }
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
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.listsContainer}>
          <SortableContext
            items={board.lists.map(l => l.id)}
            strategy={horizontalListSortingStrategy}
          >
            {board.lists.map((list) => (
              <List key={list.id} list={list} />
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
