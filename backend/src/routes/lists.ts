import { Request, Response, Router } from 'express';
import { z } from 'zod';
import * as queries from '../db/queries';

const router = Router();

// Validation schemas
const createListSchema = z.object({
  board_id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  position: z.number().int().min(0),
});

const updateListSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  position: z.number().int().min(0).optional(),
});

// POST /api/lists - Create new list
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createListSchema.parse(req.body);
    const list = await queries.createList(validated.board_id, validated.title, validated.position);
    res.status(201).json({ success: true, data: list });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/lists/:id - Update list
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const validated = updateListSchema.parse(req.body);
    const list = await queries.updateList(id, validated.title, validated.position);
    
    if (!list) {
      return res.status(404).json({ success: false, error: 'List not found' });
    }
    
    res.json({ success: true, data: list });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/lists/:id - Delete list
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await queries.deleteList(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'List not found' });
    }
    
    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
