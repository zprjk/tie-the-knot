import {Router} from 'express';
import {mediaController} from '../controllers/media';

export const mediaRoutes = Router();

mediaRoutes.get('/', mediaController.get);
mediaRoutes.post('/', mediaController.post);
