import {Router} from 'express';
import {mediaRoutes} from './media';

export const routes = Router();

routes.use('/media', mediaRoutes);
