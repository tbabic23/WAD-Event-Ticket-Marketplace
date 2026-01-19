import express from 'express';
import { router as testRouter } from './routes/test';
import { router as authRouter } from './routes/auth';
import { router as eventsRouter } from './routes/events';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', testRouter);
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);

export default app;