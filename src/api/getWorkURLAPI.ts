import axios from "axios";

export const getWorkURLAPI = async () => {
    const BACKUP_URLS = [
        'https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/',
        'https://api16-normal-c-useast2a.tiktokv.com/aweme/v1/feed/'
    ];

    let baseUrl = '';
    await Promise.all(BACKUP_URLS.map(async (url) => {
        try {
            const {data} = await axios(url);
            if (data.hasOwnProperty('aweme_list')){
                baseUrl = url;
            }
        } catch (error: any) {
            console.log(error.message);
            
        }
    }))
    return baseUrl;
}
