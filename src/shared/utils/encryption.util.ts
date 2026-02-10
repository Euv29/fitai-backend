import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

class EncryptionUtil {
    private key: Buffer;

    constructor() {
        const encryptionKey = process.env.ENCRYPTION_KEY;
        if (!encryptionKey || encryptionKey.length < 32) {
            throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
        }

        // Use the first 32 bytes as the key
        this.key = Buffer.from(encryptionKey.slice(0, 32), 'utf-8');
    }

    encrypt(plainText: string): string {
        const iv = crypto.randomBytes(IV_LENGTH);
        const salt = crypto.randomBytes(SALT_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

        const encrypted = Buffer.concat([
            cipher.update(plainText, 'utf8'),
            cipher.final(),
        ]);

        const tag = cipher.getAuthTag();

        return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
    }

    decrypt(cipherText: string): string {
        const buffer = Buffer.from(cipherText, 'base64');

        // salt is not used in decryption logic directly
        buffer.subarray(0, SALT_LENGTH);
        const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
        const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
        const encrypted = buffer.subarray(ENCRYPTED_POSITION);

        const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
        decipher.setAuthTag(tag);

        return decipher.update(encrypted) + decipher.final('utf8');
    }
}

export default new EncryptionUtil();
