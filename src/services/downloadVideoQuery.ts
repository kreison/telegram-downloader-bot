import TelegramBot from "node-telegram-bot-api";
import { regexLinkTiktok } from "../routes/routes";
import { getVideo } from "../api/download";
import { bot } from "../bot";

export const downloadVideoQueryCommand = async (query: TelegramBot.InlineQuery) => {
    const match = query.query?.match(regexLinkTiktok)?.[0];
    if (match){
        try {
            const data = await getVideo(match, false);
            if (data !== null && data?.images.length === 0 && data.id){
                bot.answerInlineQuery(
                    query.id, 
                    [
                        {
                            id: data.id, 
                            type: 'video', 
                            title: 'Tiktok Video', 
                            video_url: data.url, 
                            mime_type: 'video/mp4',
                            thumb_url: data.cover ?? data.url,
                        }
                    ], 
                    { cache_time: 3600 }
                    )
            }else {
            }
        } catch (error) {
        }
    }
}