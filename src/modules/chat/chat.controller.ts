import { Response } from 'express';
import { AuthRequest } from '../../shared/types/types';
import chatService from './chat.service';
import { HTTP_STATUS } from '../../shared/constants/constants';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { incrementUsage } from '../../shared/middleware/usage-limit.middleware';

class ChatController {
    /**
     * Send a message to AI coach
     */
    public sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
        const { message } = req.body;
        const userId = req.user?.userId || '';

        const response = await chatService.processMessage(userId, message);

        // Increment usage
        await incrementUsage(userId, 'ai_chat_count');

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: response,
        });
    });

    /**
     * Get chat history
     */
    public getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId || '';
        const history = await chatService.getChatHistory(userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: history,
        });
    });
}

export default new ChatController();
