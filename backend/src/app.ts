import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import { orchestratorService } from './services/automation/orchestrator.service';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', authRoutes);

/**
 * Trigger the full automation pipeline
 */
app.post('/api/run-pipeline', async (req: Request, res: Response) => {
  try {
    await orchestratorService.runPipeline();
    res.json({ message: 'Pipeline executed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Pipeline execution failed', details: error.message });
  }
});

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('GitHub Job Kanban AI Backend is running');
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: config.nodeEnv === 'development' ? err.message : {},
  });
});

const PORT = config.port;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${config.nodeEnv} mode`);
    
    // Start the background automation pipeline
    orchestratorService.start().catch((err) => {
      console.error('Failed to start the automation pipeline:', err);
    });
  });
}

export default app;
