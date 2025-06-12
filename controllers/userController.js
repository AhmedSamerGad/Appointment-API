import User from '../models/userModel.js';
import errorHandler from '../middlewares/errorHandler.js';
import bcrypt from 'bcryptjs'; 
import ApiResponse from '../utils/apiResponse.js';
import { genereateToken } from '../utils/generateToken.js';
export const registerUser = errorHandler(async (req, res,next) => {
    const user = await User.create(req.body);
    if(!user){
        const error= res.status(400).json(new ApiResponse('fail','User not created'));
        return next(error);
    }
    const hashPassword = await bcrypt.hash(user.password, 10);
    user.password = hashPassword;
    await user.save();
    const token = genereateToken({id: user._id, email: user.email,role: user.role}) ;
    user.token = token;
    await user.save();
    res.status(201).json(new ApiResponse('success','User created successfully', {user}));
});

export const loginUser = errorHandler(async (req, res,next) => {
    const {email,password} = req.body;
    const user = await User.findOne({email},{__v: false});
    if(!user){
        return next(new ApiResponse('fail','User not created',null));
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        return next(new ApiResponse('fail','Invalid credentials',null));
    }
    const token = genereateToken({id: user._id, email: user.email, role: user.role});
    user.token = token;
    await user.save();
    res.json(new ApiResponse('success','User logged in successfully', {user, token}));
});

export const getUserProfile = errorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if(!user){
        return next(new ApiResponse('fail','User not found',null));
    }
    res.json(new ApiResponse('success','User profile', user));
});

export const updateUserProfile = errorHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true});
    if(!user){
        const error= res.status(400).json(new ApiResponse('fail','User not found'));
        return next(error);
    }
    res.json(new ApiResponse('success','User updated successfully', user));
});

export const deleteUser = errorHandler(async (req, res, next) => { 
    const user = await User.findByIdAndDelete(req.user.id);
    if(!user){
        const error= res.status(400).json(new ApiResponse('fail','User not found'));
        return next(error);
    }
    res.json(new ApiResponse('success','User deleted successfully'));
});