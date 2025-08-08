import express from "express";
import * as userController from '../controllers/userController.js';
import {uploadSingleImage} from "../middlewares/multer.js";
import verifyToken from "../middlewares/verifyToken.js";
import allowedTo from "../middlewares/allowedTo.js";

const userRoute = express.Router();
userRoute.post('/regist',uploadSingleImage('profilePic'),userController.registerUser).post('/login',userController.loginUser).get('/profile',verifyToken,userController.getUserProfile);
userRoute.patch('/:id',verifyToken,uploadSingleImage('profilePic'),userController.updateUserProfile).delete('/:id',verifyToken,allowedTo('super-admin'),userController.deleteUser);
export default userRoute;