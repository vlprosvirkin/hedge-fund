import axios from 'axios';
import { API_CONFIG } from '../config.js';

export interface TelegramMessage {
    text: string;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
    reply_markup?: {
        inline_keyboard?: Array<Array<{
            text: string;
            callback_data?: string;
            url?: string;
        }>>;
    };
}

export class TelegramAdapter {
    private botToken: string;
    private chatId: string;
    private baseUrl: string;
    private isConnectedFlag = false;

    constructor(botToken?: string, chatId?: string) {
        this.botToken = botToken || API_CONFIG.telegram?.botToken || '';
        this.chatId = chatId || API_CONFIG.telegram?.chatId || '';
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    async connect(): Promise<void> {
        try {
            if (!this.botToken || !this.chatId) {
                throw new Error('Telegram bot token or chat ID not configured');
            }

            // Test connection by getting bot info
            const response = await axios.get(`${this.baseUrl}/getMe`);

            if (response.data.ok) {
                this.isConnectedFlag = true;
                console.log(`✅ Connected to Telegram bot: ${response.data.result.username}`);
            } else {
                throw new Error('Failed to connect to Telegram bot');
            }
        } catch (error) {
            throw new Error(`Telegram connection failed: ${error}`);
        }
    }

    async disconnect(): Promise<void> {
        this.isConnectedFlag = false;
    }

    isConnected(): boolean {
        return this.isConnectedFlag;
    }

    /**
     * Send a message to the configured Telegram chat
     */
    async sendMessage(message: TelegramMessage): Promise<void> {
        if (!this.botToken || !this.chatId) {
            throw new Error('Telegram bot token or chat ID not configured');
        }

        try {
            await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: this.chatId,
                ...message
            });
        } catch (error) {
            console.error('Failed to send Telegram message:', error);
            throw error;
        }
    }

    /**
     * Send a photo to the configured Telegram chat
     */
    async sendPhoto(photo: string | Blob, caption?: string): Promise<void> {
        if (!this.botToken || !this.chatId) {
            throw new Error('Telegram bot token or chat ID not configured');
        }

        try {
            const formData = new FormData();
            formData.append('chat_id', this.chatId);
            formData.append('photo', photo);
            if (caption) {
                formData.append('caption', caption);
            }

            await axios.post(`${this.baseUrl}/sendPhoto`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } catch (error) {
            console.error('Failed to send Telegram photo:', error);
            throw error;
        }
    }

    /**
     * Send a document to the configured Telegram chat
     */
    async sendDocument(document: string | Blob, caption?: string): Promise<void> {
        if (!this.botToken || !this.chatId) {
            throw new Error('Telegram bot token or chat ID not configured');
        }

        try {
            const formData = new FormData();
            formData.append('chat_id', this.chatId);
            formData.append('document', document);
            if (caption) {
                formData.append('caption', caption);
            }

            await axios.post(`${this.baseUrl}/sendDocument`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } catch (error) {
            console.error('Failed to send Telegram document:', error);
            throw error;
        }
    }
}
