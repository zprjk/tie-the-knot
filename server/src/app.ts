import express from 'express';
import logger from 'morgan';
import path from 'path';
import cors from 'cors';
// import { errorHandler, errorNotFoundHandler } from "./middlewares/errorHandler";
import {routes} from './routes';

// Create Express server
export const app = express();

// Express configuration
app.set('port', process.env.PORT || 3000); // Set the port
app.use(logger('dev')); // Log requests to the console
// Serve static files
app.use(
  '/images',
  express.static(path.join(__dirname, '../public/images'), {
    cacheControl: true,
    maxAge: '3d',
    etag: true,
    lastModified: true,
  })
);
app.use(express.static(path.join(__dirname, '../public/www')));
app.use(
  '/robots.txt',
  express.static(path.join(__dirname, '../public/robots.txt'))
);
app.use(express.urlencoded({extended: true})); // Parse URL-encoded bodies using qs library
app.use(express.json()); // Parse JSON bodies
app.use(cors());
app.use('/', routes);
