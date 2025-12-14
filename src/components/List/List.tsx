'use client';

import Card from '@/components/Card/Card';
import CardModal from '@/components/CardModal/CardModal';
import { useBoardContext } from '@/context/BoardContext';
import { List as ListType } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import React, { useState } from 'react';
import styles from './List.module.css';

interface ListProps {
  list: ListType;
}

export default function List({ list }: ListProps) {
  const { updateList, deleteList, createCard } = useBoardContext();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [listTitle, setListTitle] = useState(list.title);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const { setNodeRef } = useDroppable({
    id: list.id,
  });

  const handleTitleBlur = async () => {
    if (listTitle.trim() && listTitle !== list.title) {
      try {
        await updateList(list.id, { title: listTitle.trim() });
      } catch (error) {
        console.error('Failed to update list:', error);
        setListTitle(list.title);
      }
    } else {
      setListTitle(list.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setListTitle(list.title);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleAddCard = async () => {
    if (newCardTitle.trim()) {
      try {
        await createCard(list.id, newCardTitle.trim());
        setNewCardTitle('');
        setIsAddingCard(false);
      } catch (error) {
        console.error('Failed to create card:', error);
        alert('Failed to create card. Please try again.');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddCard();
    } else if (e.key === 'Escape') {
      setIsAddingCard(false);
      setNewCardTitle('');
    }
  };

  const handleDeleteList = async () => {
    if (confirm(`Delete list "${list.title}"? All cards will be deleted.`)) {
      try {
        await deleteList(list.id);
      } catch (error) {
        console.error('Failed to delete list:', error);
        alert('Failed to delete list. Please try again.');
      }
    }
  };

  return (
    <>
      <div className={styles.list}>
        <div className={styles.listHeader}>
          <input
            className={styles.listTitle}
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
          />
          <button
            className={styles.deleteListBtn}
            onClick={handleDeleteList}
            title="Delete list"
          >
            🗑️
          </button>
        </div>

        <div ref={setNodeRef} className={styles.cardsContainer}>
          <SortableContext
            items={list.cards.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {list.cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                onOpenModal={() => setSelectedCardId(card.id)}
              />
            ))}
          </SortableContext>
        </div>

        {isAddingCard ? (
          <div className={styles.addCardForm}>
            <textarea
              className={styles.addCardInput}
              placeholder="Enter card title..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className={styles.addCardActions}>
              <button className={styles.addCardBtn} onClick={handleAddCard} title="Add card">
                ✓
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
                title="Cancel"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            className={styles.showFormBtn}
            onClick={() => setIsAddingCard(true)}
          >
            <span>+</span> Add a card
          </button>
        )}
      </div>

      {selectedCardId && (
        <CardModal
          cardId={selectedCardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </>
  );
}
