import bcrypt from 'bcrypt';
import {v4 as uuid} from 'uuid';
import joi from 'joi';
import db from '../database/db.js';


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


async function createUser (req, res) {

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


};

async function userLogin (req, res) {
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
            token,
            lastStatus: Date.now()
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
};


export {createUser, userLogin};