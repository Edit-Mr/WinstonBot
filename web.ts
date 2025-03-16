import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyFormBody from '@fastify/formbody';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { Determiner } from './determiner.ts';
import { SpellingDatabase, CaseDatabase } from './database.ts';

// Get the directory name of the current module
const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Initialize and start the Fastify web server
 */
export async function startWebServer(
    spellingDatabase: SpellingDatabase,
    caseDatabase: CaseDatabase,
    port: number = 3000
) {
    const determiner = new Determiner(spellingDatabase, caseDatabase);
    const fastify = Fastify({ logger: true });

    // Register plugins
    await fastify.register(fastifyFormBody);
    await fastify.register(fastifyStatic, {
        root: join(__dirname, 'public'),
        prefix: '/',
    });

    // Define routes
    fastify.get('/', async (request, reply) => {
        return reply.sendFile('index.html');
    });

    fastify.get('/list', async (request, reply) => {
        return reply.sendFile('list.html');
    });

    fastify.get('/api/list', async (request, reply) => {
        const cases = await caseDatabase.getAllCases();
        const spelling = await spellingDatabase.getAllSpelling();
        return reply.send({ cases, spelling });
    });

    // API endpoint to check spelling
    fastify.post('/api/check', async (request, reply) => {
        const { text } = request.body as { text: string };
        
        if (!text) {
            return reply.code(400).send({ error: '請輸入文字' });
        }

        try {
            const mistakes = await determiner.checkSpelling(text);
            return { mistakes };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: '檢查時發生錯誤' });
        }
    });

    // Start the server
    try {
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Web server running at http://localhost:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }

    return fastify;
} 