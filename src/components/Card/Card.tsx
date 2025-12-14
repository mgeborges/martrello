'use client';

import { useBoardContext } from '@/context/BoardContext';
import { Card as CardType } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useState } from 'react';
import styles from './Card.module.css';

interface CardProps {
  card: CardType;
  onOpenModal: () => void;
}

export default function Card({ card, onOpenModal }: CardProps) {
  const { updateCard, deleteCard } = useBoardContext();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTitleBlur = async () => {
    setIsEditing(false);
    if (title.trim() && title !== card.title) {
      try {
        await updateCard(card.id, { title: title.trim() });
      } catch (error) {
        console.error('Failed to update card:', error);
        setTitle(card.title);
      }
    } else {
      setTitle(card.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setTitle(card.title);
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this card?')) {
      try {
        await deleteCard(card.id);
      } catch (error) {
        console.error('Failed to delete card:', error);
        alert('Failed to delete card. Please try again.');
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
    >
      {isEditing ? (
        <input
          className={styles.editableTitle}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className={styles.cardTitle}
          onClick={(e) => {
            if (e.detail === 2) {
              // Double click to edit
              e.stopPropagation();
              setIsEditing(true);
            } else {
              onOpenModal();
            }
          }}
        >
          {card.title}
        </div>
      )}

      {card.description && (
        <div className={styles.cardDescription}>{card.description}</div>
      )}

      <div className={styles.cardActions}>
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          title="Delete card"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
