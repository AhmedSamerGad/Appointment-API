import express from 'express';
import allowedTo from '../middlewares/allowedTo.js';
import verifyToken from '../middlewares/verifyToken.js';
import { getAllUsers ,changeAppointmentStatus, getAllAppointments , getAppointmentByDate , getAppointmentsByDateRange ,getAllGroups } from '../controllers/superAdminController.js';

const adminRoute= express.Router();

adminRoute.get('/users', verifyToken, allowedTo('super-admin'), getAllUsers);
adminRoute.get('/appointments', verifyToken, allowedTo('super-admin'), getAllAppointments);
adminRoute.route('/appointments/range').get( verifyToken, allowedTo('super-admin'), getAppointmentsByDateRange).get( verifyToken, allowedTo('super-admin'), getAppointmentByDate);
adminRoute.get('/groups', verifyToken, allowedTo('super-admin'), getAllGroups);
adminRoute.patch('/appointments/:id/status', verifyToken, allowedTo('super-admin'), changeAppointmentStatus);
export default adminRoute;