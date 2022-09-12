import express from 'express';
import { getValues, createValues } from '../controlles/valuesController.js';

const valuesRouter = express.Router();

valuesRouter.get('/values/:id', getValues);

valuesRouter.post('/values', createValues);

export default valuesRouter;