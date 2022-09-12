import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi';
import bcrypt from 'bcrypt';
import * as path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
app.use(cors());


//SCHEMAS PARA VALIDAR
const signupSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required()
});

const signinSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
});

//PATH CRIADO PARA SER CAPAZ DE LER O ARQUIVO .ENV NA PASTA PRINCIPAL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, '../.env')
  })

//CONEXAO ESTABELECIDA NO MONGO AO DB MYWALLET
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db('mywallet');
});

//ATIVIDADES DISPONIVEIS NO SERVIDOR

app.post('/sign-up', async (req, res) => {

    const {name, email, password, confirmPassword} = req.body;

    const validation = signupSchema.validate(req.body, {abortEarly: false});

    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        res.status(422).send(errors);
        return;
    }

    if ( confirmPassword !== password) {
        res.status(422).send("O campo de confirmação deve ser preenchido corretamente com a mesma senha que o campo acima.");
        return;
    }

    const hashPassword = bcrypt.hashSync(password, 10);

    try {
        await db.collection('users').insertOne({
            name,
            email,
            password: hashPassword
        });
        res.sendStatus(201);
    } catch (error) {
        console.error(error); 
        return res.sendStatus(500);
    }


});

app.post('/sign-in', async (req, res) => {
    const {email, password} = req.body;

    const validation = signinSchema.validate(req.body, {abortEarly: false});

    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        res.status(422).send(errors);
        return;
    }

    try {
        const user = await db.collection('users').findOne({ email, });

        if (!user) {
            return res.status(404).send('Usuário ou senha não encontrada');
        }

        const isValid = bcrypt.compareSync(password, user.password);

        if (!isValid) {
            return res.status(404).send('Usuário ou senha não encontrada');
        }

        return res.send(200);
        
    } catch (error) {
        console.error(error); 
        return res.sendStatus(500);
    }
});




app.listen(5000, () => {
    console.log('Server on');
})