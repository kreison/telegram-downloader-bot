import 'dotenv/config'
import TelegramBot from "node-telegram-bot-api";
import { startRoutes } from './routes/routes';

const TOKEN = process.env.TELEGRAM_TOKEN!;
console.log(process.env.TELEGRAM_TOKEN, 'TOKEN');

export const bot = new TelegramBot(TOKEN, {
    polling: true,
});
bot.setMyCommands([
    {
        command: '/start',
        description: 'Запуск Бота'
    },
    {
        command: '/download',
        description: 'Скачивание из тиктока'
    }
])
startRoutes();