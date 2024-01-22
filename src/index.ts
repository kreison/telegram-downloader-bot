import bot from './bot';
import express from 'express'


const PORT = 443;

const app = express();
app.use(express.json());

app.post('/', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    console.log(req, res,);
    res.sendStatus(200)
})


app.listen(PORT, async () => {
    console.log(process.env.WEBHOOK_SERVER_URL);
    
    console.log(`Server is up and running on PORT ${PORT}`)
})