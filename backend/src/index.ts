import express from 'express';
import bodyParser from 'body-parser';
import { router as testRouter } from './routes/test';
import { router as authRouter } from './routes/auth';
import { router as adminPanelRouter } from './routes/user';
import { router as eventsRouter } from './routes/events';
import cors from 'cors';
import path from 'path';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(cors());
app.use(express.json());
app.use('/api', testRouter);
app.use('/api/auth', authRouter);
app.use('/api/user', adminPanelRouter); 
app.use('/api/events', eventsRouter);

app.use(express.static(path.join(__dirname, '../../frontend/dist/frontend/browser')));

// Catch-all handler: send back index.html for any non-API routes (for SPA routing)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../../frontend/dist/frontend/browser/index.html'));
});

export default app;