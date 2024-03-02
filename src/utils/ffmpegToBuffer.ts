import Ffmpeg from "fluent-ffmpeg";
import Stream from "stream";


export const ffmpegToBuffer = async (ffmpeg: Ffmpeg.FfmpegCommand) => {
    const output = new Stream.PassThrough();
    ffmpeg
        .writeToStream(output, {end: true})
    
    
    return ((await new Promise((resolve, reject) => {
        try {
            const buffers: any = [];
            output.on('data', function (buf) {
                buffers.push(buf);
            });
            output.on('end', async () => {                                        
                const bufferStream = Buffer.concat(buffers);                
                resolve(bufferStream)
            })
        } catch (err) {
            reject(err)
        }
        
    })) as Buffer)
}