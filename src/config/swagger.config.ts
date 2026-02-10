import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

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

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
