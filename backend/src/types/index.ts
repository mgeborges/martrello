export interface Board {
  id: number;
  title: string;
  description: string;
  background: string;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: number;
  board_id: number;
  title: string;
  position: number;
  created_at: string;
}

export interface Card {
  id: number;
  list_id: number;
  title: string;
  description: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface BoardWithLists extends Board {
  lists: ListWithCards[];
}

export interface ListWithCards extends List {
  cards: Card[];
}
