import type { VercelRequest, VercelResponse } from '@vercel/node';
import createApp from './app.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await createApp();
  return app(req, res);
}
