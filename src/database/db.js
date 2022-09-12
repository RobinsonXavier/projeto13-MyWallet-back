import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, '../../.env')
})
const mongoClient = new MongoClient(process.env.MONGO_URI);

try {
    await mongoClient.connect();
    console.log('MongoDB conectado')
} catch (error) {
    console.log(error.message);
}   


const db = mongoClient.db('mywallet');

export default db;