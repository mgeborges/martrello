import { Request, Response, Router } from 'express';
import { z } from 'zod';
import * as queries from '../db/queries';

const router = Router();

// Validation schemas
const createBoardSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().default(''),
  background: z.string().optional().default('var(--gradient-primary)'),
});

const updateBoardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  background: z.string().optional(),
});

// GET /api/boards - Get all boards
router.get('/', async (req: Request, res: Response) => {
  try {
    const boards = await queries.getAllBoards();
    res.json({ success: true, data: boards });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/boards/:id - Get board with lists and cards
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const board = await queries.getBoardById(id);
    
    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }
    
    res.json({ success: true, data: board });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/boards - Create new board
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createBoardSchema.parse(req.body);
    const board = await queries.createBoard(validated.title, validated.description, validated.background);
    res.status(201).json({ success: true, data: board });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/boards/:id - Update board
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const validated = updateBoardSchema.parse(req.body);
    const board = await queries.updateBoard(id, validated.title, validated.description, validated.background);
    
    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }
    
    res.json({ success: true, data: board });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/boards/:id - Delete board
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await queries.deleteBoard(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }
    
    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
