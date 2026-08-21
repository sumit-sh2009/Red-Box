import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Application } from 'express';
import { createApp } from '../server/dist/app.js';

let app: Application | null = null;
let bootError: Error | null = null;

async function getApp(): Promise<Application> {
  if (bootError) throw bootError;
  if (!app) {
    try {
      app = await createApp();
    } catch (err) {
      bootError = err instanceof Error ? err : new Error(String(err));
      console.error('API bootstrap failed:', bootError);
      throw bootError;
    }
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (err) {
    console.error('API handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'API failed to start',
        detail: err instanceof Error ? err.message : 'unknown',
      });
    }
  }
}
