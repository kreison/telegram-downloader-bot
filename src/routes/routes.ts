import { startCommand } from "../services/start";
import { downloadHelpCommand } from "../services/downloadHelp";
import { downloadTiktokCommand } from "../services/downloadTiktok";
import { bot } from "..";


export const regexLinkTiktok = /((https:\/\/www\.tiktok\.com\/.*)|(https:\/\/vt\.tiktok\.com\/.*\/))/gi
export function startRoutes(){
    bot.onText(/^\/start/, startCommand);
    bot.onText(/^\/download/, downloadHelpCommand);
    bot.onText(regexLinkTiktok, downloadTiktokCommand);
}
