import axios, { AxiosError } from "axios";
import 'dotenv/config'
import TelegramBot, { InlineQueryResult } from "node-telegram-bot-api";

const headers = new Headers();
headers.append('User-Agent', 'TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet');


const TOKEN = process.env.TELEGRAM_TOKEN!;
console.log(process.env.TELEGRAM_TOKEN, 'TOKEN');

const bot = new TelegramBot(TOKEN, {
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
bot.onText(/^\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Скиньте ссылку и я скачаю видос");
});
bot.onText(/^\/download/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Отправьте ссылку')
})
const regexLinkTiktok = /((https:\/\/www\.tiktok\.com\/.*)|(https:\/\/vt\.tiktok\.com\/.*\/))/gi
const regexLinkTiktokRedirect = /https:\/\/vt\.tiktok\.com\/.*\//g
bot.onText(regexLinkTiktok, async (msg, ) => {
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
                        let imgsMsg
                        if (data?.images)
                            imgsMsg = await bot.sendMediaGroup(
                                chatId,
                                data.images.map((item: string, i: number) => ({
                                    media: item,
                                    type: "photo",
                                    caption: i === 0 ? msg.from?.username ? `@${msg.from?.username} ${index+1} из ${matchArray.length}` : msg.from?.first_name + ` ${index+1} из ${matchArray.length}` : undefined
                                }))
                            );
                        if (data?.musicUrl)
                            await bot.sendAudio(
                                chatId,
                                data?.musicUrl,
                                {
                                    caption: 'Аудио',
                                    reply_to_message_id: imgsMsg?.[0]?.message_id
                                }
                            )
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
        if (checkingMsg?.message_id)
            bot.deleteMessage(chatId, checkingMsg?.message_id)
        await bot.sendMessage(chatId, "Произошла ошибка");
    }
});


var getRedirectUrl = async (url: any) => {
    if(url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
        const res = await fetch(url, {
            redirect: "follow",
            // follow: 10,
        });
        console.log(res.url, 'res.url');
        
        return res.url;
    }
    return url;
}
var getIdVideo = (url: string) => {
    const matching = url.includes("/video/")
    if(!matching){
        console.log(("[X] Error: URL not found"), JSON.stringify(url));
        // exit();
        return;
    }
    // Tiktok ID is usually 19 characters long and sits after /video/
    let idVideo = url.substring(url.indexOf("/video/") + 7, url.indexOf("/video/") + 26);
    return (idVideo.length > 19) ? idVideo.substring(0, idVideo.indexOf("?")) : idVideo;
}

var getVideo = async (url: string, watermark: boolean) => {
    
    const parsedUrl = await getRedirectUrl(url)
    console.log(JSON.stringify(parsedUrl), 'url');
    
    const idVideo = getIdVideo(parsedUrl)
    const API_URL = `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id=${idVideo}`;
    console.log(API_URL);
    
    try {
        const request = await fetch(API_URL, {
            method: "GET",
            headers : headers
        });
        const body = await request.text();
        var res = JSON.parse(body);
    } catch (err) {
        console.error("Error:", err);
        console.error("Response body:", err);
    }
    let urlResult = '';
    let imagesResult: string[] = []
    let musicUrlResult = '';
    if (res.aweme_list[0].aweme_id != idVideo) {
        const body = new FormData();
        body.set("url", url);
        body.set("count", "12");
        body.set("cursor", "0");
        body.set("web", "1");
        body.set("hd", "1");
        const { data: res } = await axios.post("https://tikwm.com/api/", body);
        if (res.code === 0) {
            if (res.data.hasOwnProperty("images")) {
                imagesResult = res.data.images
                musicUrlResult = res.data.music

                return;
            } else if (res.data.hasOwnProperty("play")) {
                const location = await axios.get(`https://tikwm.com${res.data.play}`, {maxRedirects: 0}).catch((response: AxiosError) => {
                    
                    
                    return response.response?.headers['location'];
                });
                urlResult = location;
                
            }
        } else {
            return ({
                url: '',
                images: [],
                id: idVideo,
                musicUrl: ''
            })
        }
    }else {
        // check if video is slideshow
        if (!!res.aweme_list[0].image_post_info) {
            console.log(("[*] Video is slideshow"));

            // get all image urls
            res.aweme_list[0].image_post_info.images.forEach((element: any) => {
                // url_list[0] contains a webp
                // url_list[1] contains a jpeg
                imagesResult.push(element.display_image.url_list[1]);
            });
            musicUrlResult = res?.aweme_list?.[0]?.music?.play_url?.uri || ''

        } else {
            // download_addr vs play_addr
            urlResult = (watermark) ? res.aweme_list[0].video.download_addr.url_list[0] : res.aweme_list[0].video.play_addr.url_list[0];
        }
    }
    var data: {url: string, images: string[], id?: string, musicUrl: string} = {
        url: urlResult,
        images: imagesResult,
        id: idVideo,
        musicUrl: musicUrlResult,
    }
    console.log(data, 'jp');
    
    return data;
}