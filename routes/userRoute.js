import express from "express";
import * as userController from '../controllers/userController.js';
import {uploadSingleImage} from "../middlewares/multer.js";

const userRoute = express.Router();
userRoute.post('/regist',uploadSingleImage('profilePic'),userController.registerUser).post('/login',userController.loginUser).get('/profile',userController.getUserProfile);
userRoute.patch(':id',userController.updateUserProfile).delete(':id',userController.deleteUser);
export default userRoute;