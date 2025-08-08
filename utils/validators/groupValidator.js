import { check } from "express-validator";
import validator from '../../middlewares/validatorMiddleware.js';
import User from "../../models/userModel.js";
import Group from "../../models/groupModel.js";
import Appointment from "../../models/appointmentModel.js";

export const createGroupValidator = [
    check('name')
        .notEmpty()
        .withMessage('name is required')
        .isLength({ min: 5 })
        .withMessage('name should be at least 5 characters long'),
        check('admin').isMongoId().withMessage('id is invalid ').custom(async(id)=>{
            const user = await User.findById(id);
            if(!user){
                return Promise.reject('user not found');
            }
            return true;
        }),
        check('members').isArray().withMessage('members should be an array').custom(async(members)=>{
            for (const member of members) {
                const user = await User.findById(member); 
                if(!user){
                    return Promise.reject(`user not ${member} found ` );
                }
            }
            return true;
            }),
        validator
    
];

export const updatedGroupValidator = [
    check('members').optional({ nullable: true }).isArray().withMessage('members should be an array').custom(async(members)=>{
        for (const member of members) {
            const user = await User.findById(member); 
            if(!user){
                return Promise.reject(`user not ${member} found ` );
            }
        }
        return true;
        }),
    validator
]; 

export const updateAdminGroupValidator = [
    check('admin').isMongoId().withMessage('id is invalid ').custom(async(id)=>{
        const user = await User.findById(id);
        if(!user){
            return Promise.reject('user not found');
        }
        return true;
    }),
    validator
] 

export const addGroupUserValidator = [

    check('members').isArray().withMessage('members should be an array').custom(async(members)=>{
        for (const member of members) {
            const user = await User.findById(member); 
            if(!user){
                return Promise.reject(`user not ${member} found ` );
            }
        }
        return true;
        }),
    validator
]

export const removeGroupUserValidator = [
    check('members').isArray().withMessage('members should be an array').custom(async(members)=>{
        for (const member of members) {
            const user = await User.findById(member);
            if(!user){
                return Promise.reject(`user not ${member} found ` );
            }
            return true;
            }} ) ,
    validator ];

export const addGroupPostsValidator = [
    check('Appointment')
    .notEmpty()
    .withMessage('Appointment data is required')
    .isObject()
    .withMessage('Appointment must be an object'),
    check('Appointment.title')
        .notEmpty()
        .withMessage('title is required')
        .isLength({ min: 5 })
        .withMessage('title should be at least 5 characters long'),
    check('Appointment.startingdate')
        .notEmpty()
        .withMessage('starting date is required')
        .isISO8601()
        .withMessage('starting date must be a valid date format (YYYY-MM-DD)')
        .custom((value) => {
            const enteredDate = new Date(value);
            const currentDate = new Date();
            
            if (enteredDate < currentDate) {
                throw new Error('Starting date must be today or a future date');
            }
            return true;
        }),
    check('Appointment.endingdate')
        .custom((value, { req }) => {
            const endDate = new Date(value);
            const startDate = new Date(req.body.startingdate);
            
            if (endDate < startDate) {
                throw new Error('Ending date must be equal to or after starting date');
            }
            return true;
        }),
        check('Appointment.user')
        .notEmpty()
        .withMessage('user is required')
        .isMongoId()
        .withMessage('Invalid user ID')
        .custom(async (id) => {
            const user = await User.findById(id);
            if (!user) {
                return Promise.reject('User not found');
            }
            return true;
        }),
    validator
];