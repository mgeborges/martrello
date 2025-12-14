const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | any;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data: ApiResponse<T> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data.data as T;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Board methods
  async getAllBoards() {
    return this.request<any[]>('/api/boards');
  }

  async getBoardById(id: string | number) {
    return this.request<any>(`/api/boards/${id}`);
  }

  async createBoard(title: string, description: string, background: string) {
    return this.request<any>('/api/boards', {
      method: 'POST',
      body: JSON.stringify({ title, description, background }),
    });
  }

  async updateBoard(id: string | number, updates: { title?: string; description?: string; background?: string }) {
    return this.request<any>(`/api/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteBoard(id: string | number) {
    return this.request<any>(`/api/boards/${id}`, {
      method: 'DELETE',
    });
  }

  // List methods
  async createList(boardId: number, title: string, position: number) {
    return this.request<any>('/api/lists', {
      method: 'POST',
      body: JSON.stringify({ board_id: boardId, title, position }),
    });
  }

  async updateList(id: number, updates: { title?: string; position?: number }) {
    return this.request<any>(`/api/lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteList(id: number) {
    return this.request<any>(`/api/lists/${id}`, {
      method: 'DELETE',
    });
  }

  // Card methods
  async getCardById(id: number) {
    return this.request<any>(`/api/cards/${id}`);
  }

  async createCard(listId: number, title: string, description: string, position: number) {
    return this.request<any>('/api/cards', {
      method: 'POST',
      body: JSON.stringify({ list_id: listId, title, description, position }),
    });
  }

  async updateCard(id: number, updates: { title?: string; description?: string; position?: number; list_id?: number }) {
    return this.request<any>(`/api/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async moveCard(id: number, listId: number, position: number) {
    return this.request<any>(`/api/cards/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify({ list_id: listId, position }),
    });
  }

  async deleteCard(id: number) {
    return this.request<any>(`/api/cards/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
