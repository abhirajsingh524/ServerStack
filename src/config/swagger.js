const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CogniVault ServerStack API',
      version: '1.0.0',
      description: 'Secure Research Data Vault — REST API Documentation',
      contact: { name: 'CogniVault Team' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://your-production-url.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', example: 'jane@example.com' },
            password: { type: 'string', example: 'Secure@123' },
            role: { type: 'string', enum: ['admin', 'researcher'], default: 'researcher' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'jane@example.com' },
            password: { type: 'string', example: 'Secure@123' },
          },
        },
        DataCreateRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Genome Study 2024' },
            description: { type: 'string', example: 'Research on genome sequences' },
            jsonData: { type: 'object', example: { key: 'value' } },
            accessLevel: { type: 'string', enum: ['private', 'shared', 'public'], default: 'private' },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
