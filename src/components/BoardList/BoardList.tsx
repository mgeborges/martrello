'use client';

import { useBoardContext } from '@/context/BoardContext';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import styles from './BoardList.module.css';

export default function BoardList() {
  const { boards, createBoard, deleteBoard, setCurrentBoardId } = useBoardContext();
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const router = useRouter();

  const gradients = [
    'var(--gradient-primary)',
    'var(--gradient-secondary)',
    'var(--gradient-success)',
    'var(--gradient-warm)',
  ];

  const handleCreateBoard = async () => {
    if (newBoardTitle.trim()) {
      const gradient = gradients[boards.length % gradients.length];
      try {
        const newBoard = await createBoard(
          newBoardTitle.trim(),
          newBoardDescription.trim(),
          gradient
        );
        setCurrentBoardId(newBoard.id);
        router.push(`/board/${newBoard.id}`);
        setIsCreating(false);
        setNewBoardTitle('');
        setNewBoardDescription('');
      } catch (error) {
        console.error('Failed to create board:', error);
        alert('Failed to create board. Please try again.');
      }
    }
  };

  const handleBoardClick = (boardId: string) => {
    setCurrentBoardId(boardId);
    router.push(`/board/${boardId}`);
  };

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string, boardTitle: string) => {
    e.stopPropagation();
    if (confirm(`Delete board "${boardTitle}"? This will delete all lists and cards.`)) {
      try {
        await deleteBoard(boardId);
      } catch (error) {
        console.error('Failed to delete board:', error);
        alert('Failed to delete board. Please try again.');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleCreateBoard();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewBoardTitle('');
      setNewBoardDescription('');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Martrello Logo" className={styles.logo} />
          <div>
            <h1 className={styles.title}>Martrello</h1>
            <p className={styles.subtitle}>
              Organize your work and life, beautifully.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.boardsGrid}>
        {boards.map((board, index) => (
          <div
            key={board.id}
            className={styles.boardCard}
            onClick={() => handleBoardClick(board.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div>
              <h3 className={styles.boardCardTitle}>{board.title}</h3>
              {board.description && (
                <p className={styles.boardCardDescription}>
                  {board.description}
                </p>
              )}
            </div>
            <div className={styles.boardCardFooter}>
              <div className={styles.boardCardStats}>
                <span>{board.lists.length} lists</span>
                <span>
                  {board.lists.reduce((acc, list) => acc + list.cards.length, 0)}{' '}
                  cards
                </span>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => handleDeleteBoard(e, board.id, board.title)}
                title="Delete board"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        <div
          className={styles.createBoardCard}
          onClick={() => setIsCreating(true)}
        >
          <div className={styles.createIcon}>+</div>
          <div className={styles.createText}>Create new board</div>
        </div>
      </div>

      {isCreating && (
        <div className={styles.modal} onClick={() => setIsCreating(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Create Board</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Board Title</label>
              <input
                className={styles.input}
                type="text"
                placeholder="My Awesome Project"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description (Optional)</label>
              <textarea
                className={styles.textarea}
                placeholder="What is this board about?"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setIsCreating(false);
                  setNewBoardTitle('');
                  setNewBoardDescription('');
                }}
              >
                Cancel
              </button>
              <button className={styles.createBtn} onClick={handleCreateBoard}>
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
