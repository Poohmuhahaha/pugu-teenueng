import { json } from '@sveltejs/kit';

/**
 * OpenAPI 3.1 skeleton — auto-generated from Zod schemas in the next iteration.
 * For now this is a hand-written summary so SDK consumers have something to read.
 */
const OPENAPI = {
  openapi: '3.1.0',
  info: {
    title: 'LifeOS API',
    version: '0.0.1',
    description: 'Headless productivity OS — Strapi-style content CRUD scoped by workspace.',
  },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/{collection}': {
      get: {
        summary: 'List entries',
        parameters: [
          { name: 'collection', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'e.g. createdAt:desc,name:asc' },
          { name: 'pagination[page]', in: 'query', schema: { type: 'integer' } },
          { name: 'pagination[pageSize]', in: 'query', schema: { type: 'integer', maximum: 200 } },
          { name: 'fields', in: 'query', schema: { type: 'string' }, description: 'comma-separated field allowlist' },
        ],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' }, '404': { description: 'Collection not found' } },
      },
      post: {
        summary: 'Create entry',
        responses: { '201': { description: 'Created' }, '403': { description: 'Forbidden' } },
      },
    },
    '/{collection}/{id}': {
      get: { responses: { '200': { description: 'OK' } } },
      patch: { responses: { '200': { description: 'OK' } } },
      delete: { responses: { '200': { description: 'Soft-deleted' } } },
    },
    '/content-types': {
      get: { responses: { '200': { description: 'List content types' } } },
      post: { responses: { '201': { description: 'Created' } } },
    },
    '/api-keys': {
      get: { responses: { '200': { description: 'List API keys (secret never returned)' } } },
      post: { responses: { '201': { description: 'Issue new API key (returned once)' } } },
    },
    '/webhooks': {
      get: { responses: { '200': { description: 'List webhooks' } } },
      post: { responses: { '201': { description: 'Register webhook' } } },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
  },
  security: [{ bearerAuth: [] }, { apiKey: [] }],
};

export const GET = async () => json(OPENAPI);
