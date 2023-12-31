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
bot.onText(/^\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Скиньте ссылку и я скачаю видос");
});
bot.onText(/^\/download/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Отправьте ссылку')
})
bot.onText(/(https:\/\/www\.tiktok\.com\/.*)|(https:\/\/vt\.tiktok\.com\/.*)/, async (msg, match) => {
    const chatId = msg.chat.id;    
    var checkingMsg;
    try {
        const link = match?.[0] ?? match?.[1];
        checkingMsg = await bot.sendMessage(chatId, 'Проверяю...', {disable_notification: true})
        if (link) {
            const body = new FormData();
            body.set("url", link);
            body.set("count", "12");
            body.set("cursor", "0");
            body.set("web", "1");
            body.set("hd", "1");
            const { data } = await axios.post("https://tikwm.com/api/", body);
            if (data.code === 0) {
                await bot.editMessageText('Отправляю...', {chat_id: chatId, message_id: checkingMsg.message_id})
                if (data.data.hasOwnProperty("images")) {
                    await bot.sendMediaGroup(
                        chatId,
                        data.data.images.map((item: string, i: number) => ({
                            media: item,
                            type: "photo",
                            caption: i === 0 ? msg.from?.username ? `@${msg.from?.username}` : msg.from?.first_name : undefined
                        }))
                    );
                    bot.deleteMessage(chatId, checkingMsg.message_id)
                    bot.deleteMessage(chatId, msg.message_id)
                } else if (data.data.hasOwnProperty("hdplay")) {
                    const response = await axios.get(`https://tikwm.com${data.data.hdplay}`);                    
                    await bot.sendVideo(
                        chatId,
                        response.request.res.responseUrl,
                        { 
                            caption: msg.from?.username ? `@${msg.from?.username}` : msg.from?.first_name
                        }
                    );
                    bot.deleteMessage(chatId, checkingMsg.message_id);
                    bot.deleteMessage(chatId, msg.message_id);
                }
            } else {
                await bot.editMessageText(data.msg, {chat_id: chatId, message_id: checkingMsg.message_id})
            }
        }
    } catch (error) {
        console.log(error);
        if (checkingMsg?.message_id)
            bot.deleteMessage(chatId, checkingMsg?.message_id)
        await bot.sendMessage(chatId, "Произошла ошибка");
    }
});
