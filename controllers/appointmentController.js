import Appointment from '../models/appointmentModel.js';
import errorHandler from '../middlewares/errorHandler.js';
import Group from '../models/groupModel.js';
import ApiResponse from '../utils/apiResponse.js';

export const createAppointment = errorHandler(async (req, res, next) => {
    try {
        let attendance = [];
        let group = null;

        // Handle group-based appointments
        if (req.body.group) {
            group = await Group.findById(req.body.group);
            if (!group) {
                return res.status(404).json(
                    new ApiResponse('fail', 'Group not found')
                );
            }

            // Check permissions
            if (
                req.user.role !== 'admin' &&
                group.admin.toString() !== req.user.id &&
                req.user.role !== 'super-admin'
            ) {
                return res.status(403).json(
                    new ApiResponse('fail', 'Only group admins or super admins can create group appointments')
                );
            }

            attendance = group.members.map(member => member._id);
        }

        // Always include creator in attendance if not already present
        if (!attendance.includes(req.user.id)) {
            attendance.push(req.user.id);
        }

        // Prepare initial ratings for all attendees
        const initialRatings = (req.body.rating || []).length > 0
            ? attendance.map(userId => ({
                ratedUser: [userId],
                ratedBy: req.user.id,
                ratingTypes: req.body.rating.map(type => ({
                    title: type.title,
                    points: 0,
                    hasRated: false,
                    comment: ''
                })),
            }))
            : [];

        // Create appointment with all fields set
        const appointment = await Appointment.create({
            user: req.user.id,
            ...req.body,
            attendance,
            group: group ? group._id : undefined,
            status: 'pending',
            rating: initialRatings
        });

        // Add appointment to group if needed
        if (group) {
            group.Appointments.push(appointment._id);
            await group.save();
        }

        // Return populated appointment
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('user', 'name email')
            .populate('attendance', 'name email')
            .populate('rating', 'name email');

        return res.status(201).json(
            new ApiResponse('success', 'Appointment created successfully', populatedAppointment)
        );
    } catch (error) {
        console.error('Create appointment error:', error);
        return res.status(500).json(
            new ApiResponse('fail', 'Error creating appointment', error.message)
        );
    }
});
// for use in app only




export const updateAppointment = errorHandler(async (req, res) => { 
const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
if (appointment) {
    res.json(appointment);
} else {
    res.status(404).json({ message: 'Appointment not found' });
}
});

export const deleteAppointment = errorHandler(async (req, res) => {
const appointment = await Appointment.findByIdAndDelete(req.params.id);
if (appointment) {
    res.json({ message: 'Appointment deleted successfully' });
} else {
    res.status(404).json({ message: 'Appointment not found' });
}
} );

export const getAppointmentsForCurrentUser = errorHandler(async (req, res) => {
    // Use req.user.id for the current authenticated user
    const appointments = await Appointment.find({ user: req.params.id })
        .populate('attendance', 'name email');

    if (!appointments || appointments.length === 0) {
        return res.status(404).json({
            status: 'fail',
            result: 0,
            data: []
        });
    }

    return res.status(200).json({
        status: 'success',
        result: appointments.length,
        data: appointments
    });
});
