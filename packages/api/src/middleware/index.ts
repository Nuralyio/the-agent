import cors from 'cors';
import express from 'express';

/**
 * Configure CORS middleware
 */
export const corsMiddleware = cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false
});

/**
 * Configure basic Express middleware
 */
export const basicMiddleware = [
    express.json(),
    express.static('public')
];

/**
 * Error handling middleware
 */
export const errorHandler = (
    error: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): void => {
    console.error('API Error:', error);
    
    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        error: error.message || 'Internal Server Error'
    });
};

/**
 * Request logging middleware
 */
export const requestLogger = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): void => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
};
