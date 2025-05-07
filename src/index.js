import { Router } from 'itty-router';
import { handleDirectoryWebhook } from './handlers/directory-webhook.js';
import { handleDirectoryRequest } from './handlers/directory.js';
import { handleListingsRequest } from './handlers/listings.js';
import { handleSearchRequest } from './handlers/search.js';

// Create router
const router = Router();

// Define routes
router
  .post('/api/directory-webhook', handleDirectoryWebhook)
  .get('/api/directory', handleDirectoryRequest)
  .get('/api/listings', handleListingsRequest)
  .get('/api/search', handleSearchRequest)
  // Catch all unmatched routes
  .all('*', () => new Response('Not Found', { status: 404 }));

// Export fetch handler
export default {
  async fetch(request, env, ctx) {
    // Set up CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Handle OPTIONS requests (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Pass environment and context to handlers
    const response = await router.handle(request, env, ctx);
    
    // Add CORS headers to all responses
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};