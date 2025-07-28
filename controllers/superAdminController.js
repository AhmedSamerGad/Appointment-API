import errorHandler from "../middlewares/errorHandler.js";
import User from "../models/userModel.js";
import { calculateComputedStatus } from "../utils/helperFunctions.js";
import ApiResponse from "../utils/apiResponse.js";
import Appointment from "../models/appointmentModel.js";

export const getAllUsers = errorHandler(async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 4;
    const skip = (page - 1) * limit;
    const count = await User.countDocuments();
    const users = await User.find().sort({ role: { $eq: "admin" } ? 1 : -1 }).skip(skip).limit(limit);
    res.status(200).json({
        status: "success",
        results: count,
        page: page,
        data: {
            users,
        },
    });
});
export const getAppointmentByDate = errorHandler(async (req, res) => {
const appointment = await Appointment.findOne({ startingdate: req.query.date || Date.now() });
if (!appointment) {
    return res.status(404).json(new ApiResponse('fail','Appointment not found'));
        
} 
    appointment.status = calculateComputedStatus(appointment);
    await appointment.save();
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

    for (const appointment of appointments) {
       const computeStatus = calculateComputedStatus(appointment);

        if(appointment.status !==computeStatus){
        appointment.status = computeStatus;
        const start = new Date(appointment.startingdate);
        const end = appointment.endingdate ? new Date(appointment.endingdate) : null;
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));


         try{
        await appointment.save();}
        catch(error){
        console.error(`Error saving appointment ${appointment._id}:`, err.message);

        }}
    }
    // Collect timestamps for each appointment
    const timestamps = appointments.map(appointment => {
        const start = new Date(appointment.startingdate);
        const end = appointment.endingdate ? new Date(appointment.endingdate) : null;
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        return {
            appointmentId: appointment._id,
            start: start.toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
            end: end ? end.toLocaleString("en-US", { timeZone: "Africa/Cairo" }) : null,
            now: now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
            normalizedStart: start.toISOString(),
            normalizedEnd: end ? end.toISOString() : null,
        };
    });

    res.status(200).json({
        status: "success",
        page: page,
        limit: limit,
        data: {
            appointments,
        },
        timestamps,
    });
});

export const getAppointmentsByDateRange = errorHandler(async (req, res) => {
const { startDate, endDate } = req.query;

// Validate date parameters
if (!startDate || !endDate) {
    return res.status(400).json(
        new ApiResponse('fail', 'Both startDate and endDate are required')
    );
}

try {
    // Format dates to YYYY-MM-DD string format
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

    const appointments = await Appointment.find({
        startingdate: {
            $gte: formattedStartDate,
            $lte: formattedEndDate
        }
    })
    .populate('user', 'name email')
    .sort({ startingdate: 1 });

    if (!appointments || appointments.length === 0) {
        return res.status(404).json(
            new ApiResponse('fail', 
                `No appointments found between ${formattedStartDate} and ${formattedEndDate}`, 
                []
            )
        );
    }

    return res.status(200).json(
        new ApiResponse('success', 'Appointments found', appointments)
    );

} catch (error) {
    return res.status(400).json(
        new ApiResponse('fail', 'Invalid date format')
    );
}
});
export const getAllGroups = errorHandler(async (req, res) => {});

export const AppointmentReviewDetails = errorHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const appointment = await Appointment.find({appointmentId , status : 'completed'})
    .populate('user', 'name profilePicture').populate('rating', 'points comment cumulativeRatingPoints');

   if (!appointment || appointment.length ==0) {
       return res.status(404).json({status:'fail', message:'Appointment not found or not completed'});
   }

   res.status(200).json({status : 'success', data : appointment});
});
