import express from "express";
import * as userController from '../controllers/userController.js';

const userRoute = express.Router();
userRoute.post('/regist',userController.registerUser).post('/login',userController.loginUser).get('/profile',userController.getUserProfile);
userRoute.patch(':id',userController.updateUserProfile).delete(':id',userController.deleteUser);
export default userRoute;