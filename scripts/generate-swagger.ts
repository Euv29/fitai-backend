
import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../package.json';
import fs from 'fs';
import path from 'path';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FitAI API',
            version,
            description: 'API oficial do FitAI - Inteligência Artificial para Fitness',
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
            contact: {
                name: 'Suporte FitAI',
                url: 'https://fitai.com/support',
                email: 'support@fitai.com',
            },
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3000',
                description: 'Servidor Principal',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Scan files to generate docs
    apis: [
        './src/modules/**/*.routes.ts',
        './src/modules/**/*.controller.ts',
        './src/shared/types/*.ts'
    ],
};

const swaggerSpec = swaggerJsdoc(options);

// Define output path (src/swagger.json so it can be imported or copied to dist)
const outputPath = path.join(__dirname, '../src/swagger.json');

fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log(`✅ Swagger JSON generated at ${outputPath}`);
