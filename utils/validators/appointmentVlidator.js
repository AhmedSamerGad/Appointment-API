import { check } from "express-validator";
import validator from '../../middlewares/validatorMiddleware.js';
import Appointment from "../../models/appointmentModel.js";


// i want to check if the starting date ending date is greater than or equal the date today
export const createAppointmentValidator = [
    check('title').notEmpty().withMessage('title is required').isLength({ min: 5 }).withMessage('title should be at least 5 characters long'),
    check('startingdate')
        .notEmpty()
        .withMessage('starting date is required')
        .isISO8601()
        .withMessage('starting date must be a valid date format (YYYY-MM-DD)')
        .custom((value) => {
            const enteredDate = new Date(value);
            const currentDate = new Date();
            
            // Remove time component for date comparison
            enteredDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);
            
            if (enteredDate <= currentDate) {
                throw new Error('Starting date must be today or a future date');
            }
            return true;
        }),
    
    check('endingdate').optional()
        .isISO8601()
        .withMessage('ending date must be a valid date format (YYYY-MM-DD)')
        .custom((value, { req }) => {
            const endDate = new Date(value);
            const startDate = new Date(req.body.startingdate);
            
            // Remove time component for date comparison
            endDate.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            
            if (endDate < startDate) {
                throw new Error('Ending date must be equal to or after starting date');
            }
            return true;
        }),
    
    validator
];
 
export const getAppointmentsByDateRangeValidator = [
check('startingdate').notEmpty().withMessage('starting date is required'),
check('endingdate').notEmpty().withMessage('ending date is required'),
,validator
]

export const getAppointmentByDate=[
    check('startingdate').notEmpty().withMessage('starting date is required'),
    validator
]

export const startAppointmentValidator=[
    check('id').isMongoId().withMessage('id is invalid').custom(async(value , {req}) =>{
        const appointment = await Appointment.findById(req.params.id);
        if(!appointment){
            return Promise.reject('appointment not found');
        }
        if(!appointment.acceptedBy.includes(value)){
            return Promise.reject('this user is not accept the appointment');
        }
    }),
    validator
]
