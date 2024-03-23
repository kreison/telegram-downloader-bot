import axios, { AxiosError } from "axios";
import {TiktokDownloader} from '@tobyg74/tiktok-api-dl'
const headers = new Headers();
headers.append('User-Agent', 'TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet');

const getRedirectUrl = async (url: any) => {
    if(url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
        const res = await fetch(url, {
            redirect: "follow",
            // follow: 10,
        });        
        return res.url;
    }
    return url;
}
const getIdVideo = (url: string) => {
    const matching = url.includes("/video/")
    if(!matching){
        return;
    }
    // Tiktok ID is usually 19 characters long and sits after /video/
    let idVideo = url.substring(url.indexOf("/video/") + 7, url.indexOf("/video/") + 26);
    return (idVideo.length > 19) ? idVideo.substring(0, idVideo.indexOf("?")) : idVideo;
}
interface Response {url: string, images: string[], id?: string, musicUrl: string, cover?: string, data_size: number, error?: boolean, errorMsg?: string, description?: string, type?: 'image' | 'video'}

const getVideoWithTikWm = async (url: string, idVideo?: string): Promise<Response> => {
    var imagesResult: string[] = [];
    var musicUrlResult = '';
    var urlResult = ''
    var data_size = 0;

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
            const location = await axios.get(`https://tikwm.com${res.data.music}`, {maxRedirects: 0}).catch((response: AxiosError) => {
                return response.response?.headers['location'];
            });
            musicUrlResult = location
        } else if (res.data.hasOwnProperty("play")) {
            const location = await axios.get(`https://tikwm.com${res.data.play}`, {maxRedirects: 0}).catch((response: AxiosError) => {
                return response.response?.headers['location'];
            });
            urlResult = location;
            data_size = res.data?.size || 0
        }     
        return ({
            images: imagesResult,
            musicUrl: musicUrlResult,
            url: urlResult,
            data_size,
            id: idVideo,
        })
    } else {
        return ({
            url: '',
            images: [],
            id: idVideo,
            musicUrl: '',
            data_size,
            error: true,
            errorMsg: 'Tikwm API got error!'
        })
    }
}

export const getVideo = async (url: string, watermark: boolean): Promise<Response> => {
    
    const parsedUrl = await getRedirectUrl(url)
    
    const idVideo = getIdVideo(parsedUrl);
    try {
        const res = await TiktokDownloader(url, {version: 'v3'});
        var imagesResult: string[] = [];
        var musicUrlResult = '';
        var coverResult = '';
        var data_size = 0;
        var urlResult = '';
        var description = '';

        if (res.result?.type === 'image'){
            imagesResult = res.result.images ?? []
            musicUrlResult = res.result.music ?? '';
            coverResult = res.result.images?.[0] ?? '';
            description = res.result.desc ?? '';
            const data: Response = {
                url: '',
                images: imagesResult,
                id: idVideo,
                musicUrl: musicUrlResult,
                cover: coverResult,
                data_size,
                description,
                type: res.result.type
            }
            if (imagesResult.length === 0){
                const tikwmData = await getVideoWithTikWm(url, idVideo);
                return tikwmData;
            }
            return data;
        }else {
            urlResult = res.result?.video2 ?? '';
            musicUrlResult = res.result?.music ?? '';
            description = res.result?.desc ?? '';
            const data: Response = {
                url: urlResult,
                images: [],
                id: idVideo,
                musicUrl: musicUrlResult,
                cover: coverResult,
                data_size,
                description,
                type: res.result?.type
            }
            if (data.url === ''){
                const tikwmData = await getVideoWithTikWm(url, idVideo);
                return tikwmData;
            }
            return data;
        }
    } catch (error) {
        return ({
            url: '',
            images: [],
            id: idVideo,
            musicUrl: '',
            cover: '',
            data_size: 0,
            errorMsg: 'Error',
            error: true,
        })
    }
}