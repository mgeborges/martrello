'use client';

import { useBoardContext } from '@/context/BoardContext';
import React, { useEffect, useState } from 'react';
import styles from './CardModal.module.css';

interface CardModalProps {
  cardId: string;
  onClose: () => void;
}

export default function CardModal({ cardId, onClose }: CardModalProps) {
  const { boards, updateCard } = useBoardContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Find the card
  const card = boards
    .flatMap(board => board.lists)
    .flatMap(list => list.cards)
    .find(c => c.id === cardId);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description);
    }
  }, [card]);

  if (!card) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCard(cardId, { title, description });
      onClose();
    } catch (error) {
      console.error('Failed to save card:', error);
      alert('Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className={styles.modalOverlay} 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <input
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
          />
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Description</div>
          <textarea
            className={styles.descriptionTextarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a more detailed description..."
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving} title="Save changes">
            {saving ? '⏳ Saving...' : '💾 Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
