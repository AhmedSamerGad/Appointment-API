import express from "express";
import allowedTo from '../middlewares/allowedTo.js';
import verifyToken from '../middlewares/verifyToken.js';
import {createAppointment,getAppointmentByDate,getAppointmentsByDateRange,updateAppointment,getAppointmentsByStatus,deleteAppointment,startRating ,getAppointmentsForCurrentUser} from '../controllers/appointmentController.js';
import {createAppointmentValidator ,startAppointmentValidator}from '../utils/validators/appointmentVlidator.js';

const appointmentRoute = express.Router();
appointmentRoute.post('/',verifyToken,allowedTo('admin','super-admin'),createAppointmentValidator,createAppointment);
appointmentRoute.route('/').get(verifyToken,allowedTo('user','admin','super-admin'),getAppointmentsByDateRange);
appointmentRoute.get('/',verifyToken,allowedTo('user','admin','super-admin'),getAppointmentByDate)

appointmentRoute.route('/:id').put(verifyToken,allowedTo('super-admin','admin'),updateAppointment).delete(verifyToken,allowedTo('super-admin','admin'),deleteAppointment).post(verifyToken,allowedTo('super-admin','admin'),startAppointmentValidator,startRating).get(verifyToken,allowedTo('user','admin','super-admin'),getAppointmentsForCurrentUser);
appointmentRoute.get('/status',verifyToken,getAppointmentsByStatus);

export default appointmentRoute;