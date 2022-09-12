import express from 'express';
import cors from 'cors';
import db from './database/db.js';
import { ObjectId } from 'mongodb';

import { createUser, userLogin } from './controlles/authController.js';
import { getValues, createValues } from './controlles/valuesController.js';

const app = express();
app.use(express.json());
app.use(cors());


app.get('/values/:id', getValues);

app.post('/values', createValues);

app.post('/sign-up', createUser);

app.post('/sign-in', userLogin);

app.post('/status', async (req, res) => {
    const {user, authorization} = req.headers;

    const token = authorization?.replace('Bearer ', '');

    try {

        const loggedUser = await db.collection('logged').findOne({userId: ObjectId(user)});
        const compareToken = loggedUser?.token;

        if(!token || compareToken !== token) {
            res.sendStatus(401);
            return;
        }
        
        if (!loggedUser) {
            res.sendStatus(404);
            return;
        }

        await db.collection('logged').updateOne({userId: ObjectId(user)}, {$set: {lastStatus: Date.now()}});

        res.status(200).send('Atualizado');
        
    } catch (error) {
        console.error(error);
        res.status(500);
        return;
    }
});

setInterval(async () => {
    const lastUpdate = Date.now() - 15 * 1000;

    try {
        await db.collection('logged').deleteMany({lastStatus: {$lte: lastUpdate}});
    } catch (error) {
        console.error(error);
        res.status(500);
        return;
    }
}, 20000);


app.listen(5000, () => {
    console.log('Server on');
})