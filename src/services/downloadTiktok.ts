import TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot";
import { getVideo } from "../api/download";
import { sliceArrays } from "../utils/sliceArray";
import { regexLinkTiktok } from "../routes/routes";
import ffmpeg from 'fluent-ffmpeg';
import { ffmpegToBuffer } from "../utils/ffmpegToBuffer";
import { escapeRegExp } from "../utils/escapeRegex";


export async function downloadTiktokCommand (msg: TelegramBot.Message) {
    
    const chatId = msg.chat.id;    
    var checkingMsg: TelegramBot.Message | undefined;
    const matchArray = msg.text?.match(regexLinkTiktok);
    checkingMsg = await bot.sendMessage(chatId, `Проверяю...`);
    let index = 0;
    let retryLimit = 0;
    let sliceIndexAlbum = 0;
    while ((index < (matchArray?.length || 0)) || (retryLimit >= 10)) {
        try {
            const match = matchArray?.[index]
            const regex = new RegExp(`${escapeRegExp(match || '')} \n?(.*)`, 'i');
            const sourceTitle = msg.text?.match(regex)?.[1] ? `"${msg.text?.match(regex)?.[1]}"` : ''
            if (match) {
                const data = await getVideo(match, false);
                if (data === null || data.error){
                    bot.sendMessage(chatId, `Произошла ошибка\nКод ошибки: ${data.errorMsg} \nСсылка на видео: ${match}`)
                };
                if ((data?.images?.length ?? 0) > 0) {
                    let imgsMsg: {msg: any} = {msg}
                    if (data?.images){
                        const slicedArray = sliceArrays(data.images, 10)
                        const captionText = (index: number, i: number) => (
                            (` ${index+1} из ${matchArray.length}.\n${sliceArrays.length > 0 ? `Альбом ${i+1} из ${slicedArray.length}` : ''}` )
                        )
                        while (sliceIndexAlbum < slicedArray.length) {
                            const subArray = slicedArray[sliceIndexAlbum];
                            imgsMsg.msg = await bot.sendMediaGroup(
                                chatId,
                                subArray.map((item: string, i: number) => ({
                                    media: item,
                                    type: "photo",
                                    caption: 
                                        ((i === 0)
                                            ? 
                                            `${
                                                (msg.from?.username)
                                                ? 
                                                    `@${msg.from?.username}` + captionText(index, sliceIndexAlbum)
                                                : 
                                                    msg.from?.first_name + captionText(index, sliceIndexAlbum)
                                            } ${sourceTitle}`
                                        : undefined)
                                        
                                    
                            })));
                            sliceIndexAlbum++
                        }
                    }
                    if (data?.musicUrl){
                            if (data?.musicUrl.includes('.mp3')){
                                await bot.sendAudio(msg.chat.id, data?.musicUrl, {reply_to_message_id: imgsMsg.msg?.[0].message_id});
                            }else {
                                const bufferStream = await ffmpegToBuffer(ffmpeg({timeout: 20, })
                                    .input(data?.musicUrl)
                                    .toFormat('mp3'))
                                await bot.sendAudio(
                                    msg.chat.id, 
                                    bufferStream, 
                                    {
                                        reply_to_message_id: imgsMsg.msg?.[0].message_id
                                    }, 
                                    {
                                        filename: 'Музыка',
                                        contentType: 'audio/mp3'
                                    })
                            }
                    }
                } else if (data?.url) {
                    await bot.sendVideo(
                        chatId,
                        data.url,
                        { 
                            caption: 
                            `
                            ${
                                msg.from?.username 
                                ? 
                                    `@${msg.from?.username} ${index+1} из ${matchArray.length}` 
                                : 
                                    msg.from?.first_name + ` ${index+1} из ${matchArray.length}`
                            } ${sourceTitle}
                            `
                        }
                    );
                    
                }
            }else {
                bot.editMessageText('Проверка не прошла...', {chat_id: chatId, message_id: checkingMsg?.message_id})
            }
            index++
            sliceIndexAlbum = 0;
        } catch (error: any) {     
            retryLimit++
            console.log(error.message, 'error');
            const regexLimitError = /ETELEGRAM: 429 Too Many Requests: retry after (\d*)/;
            if (regexLimitError.test(error.message)){
                
                const limitTimeoutMiliseconds = (error.message.match(regexLimitError)?.[1] ?? 1) * 1000;
                console.log(`wait ${limitTimeoutMiliseconds}`);
                await new Promise((resolve) => setTimeout(() => resolve(undefined), limitTimeoutMiliseconds));
                await bot.sendMessage(chatId, `Слишком много запросов. Ждал ${error.message.match(regexLimitError)?.[1] ?? 1} секунд. Пробую еще раз...`);
            }else {
                await bot.sendMessage(chatId, `Произошла ошибка ${error.message}`);
            }
            if (checkingMsg?.message_id){
                bot.deleteMessage(chatId, checkingMsg?.message_id)
            }
        }
    }
    bot.deleteMessage(chatId, checkingMsg?.message_id || 0);
    await bot.sendMessage(chatId, `Загрузка завершена`);
}