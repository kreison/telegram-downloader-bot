import bot from './bot';
import express from 'express'


const PORT = 8080;

const app = express();
app.use(express.json());

app.post('/', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});


app.listen(PORT, async () => {
    console.log(`Server is up and running on PORT ${PORT}`)
})