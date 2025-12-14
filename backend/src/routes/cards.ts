import { Request, Response, Router } from 'express';
import { z } from 'zod';
import * as queries from '../db/queries';

const router = Router();

// Validation schemas
const createCardSchema = z.object({
  list_id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().optional().default(''),
  position: z.number().int().min(0),
});

const updateCardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  position: z.number().int().min(0).optional(),
  list_id: z.number().int().positive().optional(),
});

const moveCardSchema = z.object({
  list_id: z.number().int().positive(),
  position: z.number().int().min(0),
});

// GET /api/cards/:id - Get card details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const card = await queries.getCardById(id);
    
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({ success: true, data: card });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cards - Create new card
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createCardSchema.parse(req.body);
    const card = await queries.createCard(validated.list_id, validated.title, validated.description, validated.position);
    res.status(201).json({ success: true, data: card });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/cards/:id - Update card
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const validated = updateCardSchema.parse(req.body);
    const card = await queries.updateCard(id, validated.title, validated.description, validated.position, validated.list_id);
    
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({ success: true, data: card });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/cards/:id/move - Move card to different list/position
router.put('/:id/move', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const validated = moveCardSchema.parse(req.body);
    const card = await queries.moveCard(id, validated.list_id, validated.position);
    
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({ success: true, data: card });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/cards/:id - Delete card
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await queries.deleteCard(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
