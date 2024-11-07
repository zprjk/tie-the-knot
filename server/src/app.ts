import express from 'express';
import logger from 'morgan';
import path from 'path';
import cors from 'cors';
import {routes} from './routes';

// ---- Create Express server ----
export const app = express();

// ---- Express Setup ----
// Set the port
app.set('port', process.env.PORT || 3000);
// Log requests to the console
app.use(logger('dev'));
// Serve static files
app.use(
  '/images',
  express.static(
    path.join(__dirname, '../public/images'),
    // Cache setup
    {
      cacheControl: true,
      maxAge: '3d',
      etag: true,
      lastModified: true,
    }
  )
);
app.use(express.static(path.join(__dirname, '../public/www')));
app.use(
  '/robots.txt',
  express.static(path.join(__dirname, '../public/robots.txt'))
);
// Parse URL-encoded bodies using qs library
app.use(express.urlencoded({extended: true}));
// Parse JSON bodies
app.use(express.json());
// Enable CORS
app.use(cors());

// ---- Routes ----
app.use('/', routes);
