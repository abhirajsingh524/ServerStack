const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CogniVault ServerStack API',
      version: '1.0.0',
      description: `
## 🔐 CogniVault ServerStack — Secure Research Data Vault

**Base URL:** \`/api/v1\`

### Authentication
All protected endpoints require a **Bearer JWT token** in the Authorization header:
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

### Token Lifecycle
- **Access Token:** expires in 15 minutes
- **Refresh Token:** expires in 7 days — use \`POST /api/v1/auth/refresh\` to rotate

### Roles
| Role | Permissions |
|------|-------------|
| \`admin\` | Full access — all users, all data, audit logs |
| \`researcher\` | Own data only |
      `,
      contact: { name: 'CogniVault Team' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development Server' },
      { url: 'https://your-production-url.onrender.com', description: 'Production Server' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your access token (obtained from POST /api/v1/auth/login)',
        },
      },
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', example: 'Jane Doe', minLength: 2, maxLength: 100 },
            email:    { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', example: 'Secure@123', description: 'Min 8 chars, must include uppercase, lowercase, number, special char' },
            role:     { type: 'string', enum: ['admin', 'researcher'], default: 'researcher' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', example: 'Secure@123' },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            accessToken:  { type: 'string', description: 'JWT access token (15 min expiry)' },
            refreshToken: { type: 'string', description: 'JWT refresh token (7 day expiry)' },
            user: {
              type: 'object',
              properties: {
                id:    { type: 'string' },
                name:  { type: 'string' },
                email: { type: 'string' },
                role:  { type: 'string', enum: ['admin', 'researcher'] },
              },
            },
          },
        },
        DataCreateRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title:       { type: 'string', example: 'Genome Study 2024', maxLength: 200 },
            description: { type: 'string', example: 'Research on genome sequences', maxLength: 1000 },
            jsonData:    { type: 'object', example: { key: 'value' }, description: 'Sensitive data — will be AES-256-GCM encrypted at rest' },
            accessLevel: { type: 'string', enum: ['private', 'shared', 'public'], default: 'private' },
            tags:        { type: 'array', items: { type: 'string' }, example: ['genomics', '2024'] },
            file:        { type: 'string', format: 'binary', description: 'Optional file attachment (max 10MB)' },
          },
        },
        DataRecord: {
          type: 'object',
          properties: {
            _id:             { type: 'string' },
            title:           { type: 'string' },
            description:     { type: 'string' },
            accessLevel:     { type: 'string', enum: ['private', 'shared', 'public'] },
            tags:            { type: 'array', items: { type: 'string' } },
            fileUrl:         { type: 'string', nullable: true },
            fileOriginalName:{ type: 'string', nullable: true },
            ownerId:         { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } },
            decryptedData:   { type: 'object', description: 'Only present when fetching by ID as owner/admin' },
            createdAt:       { type: 'string', format: 'date-time' },
            updatedAt:       { type: 'string', format: 'date-time' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data:    { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page:  { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid access token',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Input validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
