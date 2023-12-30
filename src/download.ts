import axios from "axios";

const fs = require("fs");
const { mkdir } = require("fs/promises");
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const path = require("path");
export const downloadFile = (async (url: string, fileName: string) => {
  const res = await axios.get(url);
  if (!fs.existsSync("downloads")) await mkdir("downloads"); //Optional if you already have downloads directory
  const destination = path.resolve("./downloads", fileName);
  const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
  await finished(Readable.fromWeb(res.data.body).pipe(fileStream));
});