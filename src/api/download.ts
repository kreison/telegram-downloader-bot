import axios, { AxiosError } from "axios";

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
        console.log(("[X] Error: URL not found"), JSON.stringify(url));
        // exit();
        return;
    }
    // Tiktok ID is usually 19 characters long and sits after /video/
    let idVideo = url.substring(url.indexOf("/video/") + 7, url.indexOf("/video/") + 26);
    return (idVideo.length > 19) ? idVideo.substring(0, idVideo.indexOf("?")) : idVideo;
}

export const getVideo = async (url: string, watermark: boolean) => {
    
    const parsedUrl = await getRedirectUrl(url)
    
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
    let coverResult = '';
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
                const location = await axios.get(`https://tikwm.com${res.data.music}`, {maxRedirects: 0}).catch((response: AxiosError) => {
                    return response.response?.headers['location'];
                });
                musicUrlResult = location
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
            coverResult = res?.aweme_list?.[0]?.video?.cover?.url_list[0]
        }
    }
    var data: {url: string, images: string[], id?: string, musicUrl: string, cover?: string} = {
        url: urlResult,
        images: imagesResult,
        id: idVideo,
        musicUrl: musicUrlResult,
        cover: coverResult,
    }
    console.log(data, 'jp');
    
    return data;
}