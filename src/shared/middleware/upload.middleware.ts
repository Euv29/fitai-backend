import multer from 'multer';
import { AppError } from './error.middleware';
import { HTTP_STATUS, FILE_UPLOAD } from '../constants/constants';

// Configure storage (using memory storage as we'll likely upload to Supabase or process via AI)
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
    if (FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError(HTTP_STATUS.BAD_REQUEST, 'Tipo de arquivo inválido. Use JPEG, PNG ou WebP.'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: FILE_UPLOAD.MAX_SIZE,
    },
});
