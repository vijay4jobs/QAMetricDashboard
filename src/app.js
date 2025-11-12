import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import metricsRouter from './routes/metrics.js';
import projectsRouter from './routes/projects.js';
import testRunsRouter from './routes/testRuns.js';
import defectsRouter from './routes/defects.js';
import metricTargetsRouter from './routes/metricTargets.js';
import { login, authMiddleware } from './auth.js';

dotenv.config();
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/login', login);

// Protected below (comment out authMiddleware if not needed during early dev)
// app.use('/api', authMiddleware);

app.use('/api/metrics', metricsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/test-runs', testRunsRouter);
app.use('/api/defects', defectsRouter);
app.use('/api/metric-targets', metricTargetsRouter);

app.get('/api/health', (req,res)=> res.json({ status: 'ok'}));

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Server http://localhost:${port}`));
