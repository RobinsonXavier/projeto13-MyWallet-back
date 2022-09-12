import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import joi from 'joi';
import bcrypt from 'bcrypt';
import {v4 as uuid} from 'uuid';
import * as path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
app.use(cors());


//SCHEMAS PARA VALIDAR
const signupSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    confirmPassword: joi.string().required()
});

const signinSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
});

const valueSchema = joi.object({
    description: joi.string().required(),
    value: joi.number().required(),
    type: joi.string().valid('entry', 'exit').required(),
    userId: joi.string().required()
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

app.get('/values/:id', async (req, res) => {
    const id = ObjectId(req.params.id);
    const {authorization} = req.headers;

    const token = authorization?.replace('Bearer ', '');
    
    try {

        const userToken = await db.collection('logged').findOne({token});
        const compareId = userToken.userId?.toString();

        if (!token || compareId !== req.params.id) {
            return res.sendStatus(401);
        }

        const response = await db.collection('values').find({userId: id}).toArray();

        const user = await db.collection('users').findOne({_id: id});

        if(!user){
            return res.status(404).send('usuário não encontrado');
        }

        if (!response) {
           return res.send({});
        }

        const newResponse = response.map(element => {
            delete element._id;
            return element; 
        })

        res.send(newResponse);

        
    } catch (error) {
        console.error(error); 
        return res.sendStatus(500);
    }
});

app.post('/values', async (req, res) => {
    const {description, value, type, userId} = req.body;
    const {authorization} = req.headers;

    const token = authorization?.replace('Bearer ', '');

    const validation = valueSchema.validate(req.body, {abortEarly: false});

    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        res.status(422).send(errors);
        return;
    }

    try {
        const userToken = await db.collection('logged').findOne({token});
        const compareId = userToken.userId?.toString();

        if (!token || compareId !== userId) {
            return res.sendStatus(401);
        }

        await db.collection('values').insertOne({
            userId: ObjectId(userId),
            description,
            value,
            type,
            time: dayjs().format('HH:mm:ss')
        });

        res.sendStatus(201);
        
    } catch (error) {
        console.error(error); 
        return res.sendStatus(500);
    }

});

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

        const foundEmail = await db.collection('users').findOne( { email, });

        if (foundEmail) {
            res.status(409).send('o email já está cadastrado.');
            return;
        }

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

        const token = uuid();

        await db.collection('logged').insertOne( {
            userId: user._id,
            token
        })

        return res.status(200).send({
            name: user.name,
            id: user._id,
            token
        });

    } catch (error) {
        console.error(error); 
        return res.sendStatus(500);
    }
});





app.listen(5000, () => {
    console.log('Server on');
})