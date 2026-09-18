import type { Env } from './lib/db';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response('not found', { status: 404 });
  },
};
