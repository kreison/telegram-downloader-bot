import TelegramBot from "node-telegram-bot-api"
import { bot } from ".."

export const downloadHelpCommand = (msg: TelegramBot.Message) => {
    bot.sendMessage(msg.chat.id, 'Отправьте ссылку')
}