import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import authRoutes from './routes/auth';
import carRoutes from './routes/cars';
import mapRoutes from './routes/map';
import rentalRoutes from './routes/rentals';
import tariffRoutes from './routes/tariffs';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';
import supportRoutes from './routes/support';
import notificationRoutes from './routes/notifications';
import { errorHandler } from './middleware/errorHandler';
import { startFuelMonitor } from './jobs/fuelMonitor';
import { startTripMonitor } from './jobs/tripMonitor';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/auth', authRoutes);
app.use('/cars', carRoutes);
app.use('/map', mapRoutes);
app.use('/rentals', rentalRoutes);
app.use('/tariffs', tariffRoutes);
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);
app.use('/support', supportRoutes);
app.use('/notifications', notificationRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CarShare backend running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  startFuelMonitor();
  startTripMonitor();
});

export default app;
