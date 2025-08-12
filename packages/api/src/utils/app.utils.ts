import express from 'express';
import { corsMiddleware, basicMiddleware, errorHandler, requestLogger } from '../middleware';
import routes from '../routes';

/**
 * Create and configure Express application
 */
export function createApp(): express.Application {
    const app = express();

    // Request logging
    app.use(requestLogger);

    // CORS middleware
    app.use(corsMiddleware);

    app.use(basicMiddleware);

    // Routes
    app.use(routes);

    // Error handling middleware (must be last)
    app.use(errorHandler);

    return app;
}
