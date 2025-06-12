import errorHandler from "../middlewares/errorHandler";
import User from "../models/userModel";
import Appointment from "../models/appointmentModel";

export const getAllUsers = errorHandler(async (req, res) => {
    const users = await User.find().sort({ role: { $eq: "admin" } ? -1 : 1 });
    res.status(200).json({
        status: "success",
        data: {
            users,
        },
    });
});
export const getAppointmentByDate = errorHandler(async (req, res,next) => {
const appointment = await Appointment.findOne({ startingdate: req.query.date || Date.now() });
if (!appointment) {
    return res.status(404).json(new ApiResponse('fail','Appointment not found'));
        
} 
res.json(new ApiResponse('success','Appointment found', appointment));
});

export const changeAppointmentStatus = errorHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });

    if (!appointment) {
        return res.status(404).json({
            status: "fail",
            message: "Appointment not found",
        });
    }

    res.status(200).json({
        status: "success",
        data: {
            appointment,
        },
    });
});

export const getAllAppointments = errorHandler(async (req, res) => {
    const  query  = {...req.query};
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete query[el]);
    
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 5;
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query).skip(skip).limit(limit);
    res.status(200).json({
        status: "success",
        data: {
            appointments,
        },
    });
});
export const getAllGroups = errorHandler(async (req, res) => {});
