export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string;
  position: number;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  description: string;
  background: string;
  lists: List[];
}
