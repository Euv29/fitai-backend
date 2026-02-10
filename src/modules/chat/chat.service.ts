import logger from '../../shared/utils/logger.util';
import aiConfig from '../../config/ai.config';
import databaseConfig from '../../config/database.config';
import { AppError } from '../../shared/middleware/error.middleware';
import { HTTP_STATUS } from '../../shared/constants/constants';

class ChatService {
    private supabase = databaseConfig.getClient();

    /**
     * Process a message using AI (Gemini)
     */
    public async processMessage(userId: string, message: string) {
        try {
            logger.info('Processing chat message with Gemini', { userId });

            // 1. Get user profile for context
            const { data: user } = await this.supabase
                .from('users')
                .select('name, fitness_goal, experience_level')
                .eq('id', userId)
                .single();

            // 2. Fetch recent history for context (last 5 messages)
            const { data: history } = await this.supabase
                .from('chat_messages')
                .select('role, message')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            const chatHistory = (history || []).reverse().map((m: { role: string; message: string }) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.message }],
            }));

            // 3. Save user message
            await this.supabase.from('chat_messages').insert({
                user_id: userId,
                message,
                role: 'user',
            });

            // 4. Construct perspective/persona
            const systemInstruction = `
                Você é o Coach FitAI, um especialista em fitness, musculação e nutrição de elite.
                O usuário se chama ${user?.name || 'Atleta'}.
                Objetivo do usuário: ${user?.fitness_goal || 'Melhorar a forma física'}.
                Nível de experiência: ${user?.experience_level || 'Iniciante'}.
                
                Seja motivador, técnico mas acessível, e foque em segurança e resultados baseados em ciência.
                Mantenha as respostas concisas e diretas ao ponto.
            `;

            // 5. Call Gemini
            const model = aiConfig.getCustomModel(systemInstruction);
            const chat = model.startChat({
                history: chatHistory,
            });

            const result = await chat.sendMessage(message);
            const aiContent = result.response.text();

            // 6. Save assistant response
            const { data: savedResponse } = await this.supabase.from('chat_messages').insert({
                user_id: userId,
                message: aiContent,
                role: 'assistant',
            }).select().single();

            return {
                role: 'assistant',
                content: aiContent,
                timestamp: savedResponse?.created_at || new Date().toISOString(),
            };
        } catch (error) {
            logger.error('Chat processing error', { error, userId });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, 'Falha ao processar mensagem da IA');
        }
    }

    /**
     * Get user chat history
     */
    public async getChatHistory(userId: string) {
        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            logger.error('Fetch chat history error', { error, userId });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, 'Falha ao buscar histórico de chat');
        }
    }
}

export default new ChatService();
