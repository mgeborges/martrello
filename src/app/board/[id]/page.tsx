'use client';

import Board from '@/components/Board/Board';
import { useBoardContext } from '@/context/BoardContext';
import { useParams } from 'next/navigation';

export default function BoardPage() {
  const params = useParams();
  const { boards } = useBoardContext();
  const boardId = params.id as string;

  const board = boards.find((b) => b.id === boardId);

  if (!board) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Board not found</h1>
        <a href="/">← Back to boards</a>
      </div>
    );
  }

  return <Board board={board} />;
}
