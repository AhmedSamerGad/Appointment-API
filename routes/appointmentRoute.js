import express from "express";
import allowedTo from '../middlewares/allowedTo.js';
import verifyToken from '../middlewares/verifyToken.js';
import {createAppointment,updateAppointment,deleteAppointment ,getAppointmentsForCurrentUser} from '../controllers/appointmentController.js';
import {createAppointmentValidator ,startAppointmentValidator}from '../utils/validators/appointmentVlidator.js';
import { startRating } from "../controllers/ratingController.js";

const appointmentRoute = express.Router();
appointmentRoute.post('/',verifyToken,allowedTo('admin','super-admin'),createAppointmentValidator,createAppointment);
appointmentRoute.route('/:id').patch(verifyToken,allowedTo('super-admin','admin'),updateAppointment).delete(verifyToken,allowedTo('super-admin','admin'),deleteAppointment).get(verifyToken,allowedTo('user','admin','super-admin'),getAppointmentsForCurrentUser);
appointmentRoute.patch('/rating/:id',verifyToken,allowedTo('super-admin','admin'),startAppointmentValidator,startRating)
export default appointmentRoute;