import TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot";
import { getVideo } from "../api/download";
import { sliceArrays } from "../utils/sliceArray";
import { regexLinkTiktok } from "../routes/routes";
import ffmpeg from 'fluent-ffmpeg';
import Stream from 'stream'

export async function downloadTiktokCommand (msg: TelegramBot.Message ) {
    const chatId = msg.chat.id;    
    var checkingMsg: TelegramBot.Message | undefined;
    const matchArray = msg.text?.match(regexLinkTiktok);
    console.log(matchArray, 'matchArray');
    
    try {
        checkingMsg = await bot.sendMessage(chatId, `Проверяю...`);
        for (let index = 0; index < (matchArray?.length || 0); index++) {
            const match = matchArray?.[index]
            if (match) {
                const data = await getVideo(match, false);
                console.log(data, 'datadatadata');
                
                if (data !== null) {
                    if ((data?.images?.length ?? 0) > 0) {
                        let imgsMsg: {msg: any} = {msg}
                        if (data?.images){
                            const slicedArray = sliceArrays(data.images, 10)
                            const captionText = (index: number, i: number) => (
                                (` ${index+1} из ${matchArray.length}.\n${sliceArrays.length > 0 ? `Альбом ${i+1} из ${slicedArray.length}` : ''}` )
                            )
                            for (let sliceIndex = 0; sliceIndex < slicedArray.length; sliceIndex++) {
                                const subArray = slicedArray[sliceIndex];
                                imgsMsg.msg = await bot.sendMediaGroup(
                                    chatId,
                                    subArray.map((item: string, i: number) => ({
                                        media: item,
                                        type: "photo",
                                        caption: (i === 0 ? msg.from?.username ? 
                                        `@${msg.from?.username}` + captionText(index, sliceIndex)
                                        : 
                                        msg.from?.first_name + captionText(index, sliceIndex)
                                        : 
                                        undefined)
                                        
                                    })));
                            }
                        }
                        if (data?.musicUrl){
                                if (data?.musicUrl.includes('.mp3')){
                                    await bot.sendAudio(msg.chat.id, data?.musicUrl, {reply_to_message_id: imgsMsg.msg?.[0].message_id});
                                }else {
                                    // const bufferStream = new BufferStream({encoding:'utf8', size:'flexible'});
                                    const output = new Stream.PassThrough();
                                    ffmpeg({timeout: 20, logger: {
                                        error(...data) {
                                            console.log(data, 'error');
                                            
                                        },
                                        info(...data) {
                                            console.log(data, 'info');
                                            
                                        },
                                        warn(...data) {
                                            console.log(data, 'warn');
                                            
                                        },
                                        debug(...data) {
                                                console.log(data, 'debug');
                                                
                                            },
                                        }})
                                        .input(data?.musicUrl)
                                        .toFormat('mp3')
                                        .writeToStream(output, {end: true})
                                        
                                    await new Promise((resolve, reject) => {
                                        const buffers: any = [];
                                        output.on('data', function (buf) {
                                            buffers.push(buf);
                                        });
                                        output.on('end', async () => {                                        
                                            const bufferStream = Buffer.concat(buffers);
                                            console.log('end', bufferStream);
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
                                            .catch((err) => {
                                                reject(err)
                                            });
                                            resolve(undefined)
                                        })
                                    })
                                }
                        }
                    } else if (data?.url) {
                        await bot.sendVideo(
                            chatId,
                            data.url,
                            { 
                                caption: msg.from?.username ? `@${msg.from?.username} ${index+1} из ${matchArray.length}` : msg.from?.first_name + ` ${index+1} из ${matchArray.length}`
                            }
                        );
                    }
                } else {
                }
            }else {
                bot.editMessageText('Проверка не прошла...', {chat_id: chatId, message_id: checkingMsg?.message_id})
            }
        }
        bot.deleteMessage(chatId, checkingMsg?.message_id || 0);
        await bot.sendMessage(chatId, `Скачано успешно!`);
    } catch (error) {     
        console.log(error, 'error');
           
        if (checkingMsg?.message_id)
            bot.deleteMessage(chatId, checkingMsg?.message_id)
        await bot.sendMessage(chatId, "Произошла ошибка");
    }
}