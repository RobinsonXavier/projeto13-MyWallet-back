import express from 'express';
import { createUser,userLogin, 
     updateLoggedUsersStatus } from '../controlles/authController.js';


const authRouter = express.Router();

authRouter.post('/sign-up', createUser);

authRouter.post('/sign-in', userLogin);

authRouter.post('/status', updateLoggedUsersStatus);

export default authRouter;