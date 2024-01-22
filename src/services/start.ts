import TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot";

export const startCommand = (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Скиньте ссылку и я скачаю видос");
}
