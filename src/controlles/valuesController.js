import joi from 'joi';
import dayjs from 'dayjs';
import db from '../database/db.js';
import { ObjectId } from 'mongodb';


const valueSchema = joi.object({
    description: joi.string().required(),
    value: joi.number().required(),
    type: joi.string().valid('entry', 'exit').required(),
    userId: joi.string().required()
});

async function getValues (req, res) {
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
};

async function createValues (req, res) {
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

        if (type === 'exit') {
            await db.collection('values').insertOne({
                userId: ObjectId(userId),
                description,
                value: -value,
                type,
                time: dayjs().format('DD/MM')
            });
    
            res.sendStatus(201);
            return;
        }

        await db.collection('values').insertOne({
            userId: ObjectId(userId),
            description,
            value,
            type,
            time: dayjs().format('DD/MM')
        });

        res.sendStatus(201);
        
    } catch (error) {
        console.error(error); 
        return res.sendStatus(500);
    }

};

export {getValues, createValues};