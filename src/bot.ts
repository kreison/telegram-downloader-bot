import 'dotenv/config'
import TelegramBot from "node-telegram-bot-api";
import { startRoutes } from './routes/routes';

export const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, {
    webHook: true,
    filepath: false,
})
bot.setWebHook(process.env.WEBHOOK_SERVER_URL!);
bot.openWebHook()

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
export default bot;