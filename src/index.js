import express from 'express';
import cors from 'cors';
import authRouter from './routers/authRouter.js';
import valuesRouter from './routers/valuesRouter.js';

import { setIntervalDeleteOfflineUsers } from './controlles/authController.js';


const app = express();
app.use(express.json());
app.use(cors());

app.use(authRouter);

app.use(valuesRouter);

setInterval(setIntervalDeleteOfflineUsers, 20000);


app.listen(5000, () => {
    console.log('Server on');
});