import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import 'dotenv/config'

const TOKEN = process.env.TELEGRAM_TOKEN!;
console.log(process.env.TELEGRAM_TOKEN, 'TOKEN');

const bot = new TelegramBot(TOKEN, { polling: true });
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
bot.onText(/^\/start$/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Скиньте ссылку и я скачаю видос");
});
bot.onText(/^\/download$/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Отправьте ссылку в формате /download <ссылка>')
})
bot.onText(/^\/download (https:\/\/.*$)/, async (msg, match) => {
    const chatId = msg.chat.id;
    try {
        const link = match?.[1];
        if (link) {
            const body = new FormData();
            body.set("url", link);
            body.set("count", "12");
            body.set("cursor", "0");
            body.set("web", "1");
            body.set("hd", "1");
            const { data } = await axios.post("https://tikwm.com/api/", body);
            if (data.code === 0) {
                if (data.data.hasOwnProperty("images")) {
                    await bot.sendMediaGroup(
                        chatId,
                        data.data.images.map((item: string) => ({
                            media: item,
                            type: "photo",
                        })),
                        { reply_to_message_id: msg.message_id }
                    );
                } else if (data.data.hasOwnProperty("hdplay")) {
                    await bot.sendVideo(
                        chatId,
                        `https://tikwm.com${data.data.hdplay}`,
                        { reply_to_message_id: msg.message_id }
                    );
                }
            } else {
                await bot.sendMessage(chatId, data.msg);
            }
        }
    } catch (error) {
        console.log(error);

        await bot.sendMessage(chatId, "Произошла ошибка");
    }
});
