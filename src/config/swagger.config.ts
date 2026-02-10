import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

let swaggerSpec: any;

if (process.env.NODE_ENV === 'production') {
    // In production (Vercel), verify if swagger.json exists, otherwise use empty object
    try {
        swaggerSpec = require('../swagger.json');
    } catch (error) {
        console.warn('⚠️ Swagger JSON not found, using empty spec');
        swaggerSpec = { openapi: '3.0.0', info: { title: 'FitAI API', version }, paths: {} };
    }
} else {
    // In development, generate dynamically
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
                    url: 'http://localhost:3000',
                    description: 'Servidor de Desenvolvimento',
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
        apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts', './src/shared/types/*.ts'],
    };

    swaggerSpec = swaggerJsdoc(options);
}

export default swaggerSpec;
