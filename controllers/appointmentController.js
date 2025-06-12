import Appointment from '../models/appointmentModel.js';
import errorHandler from '../middlewares/errorHandler.js';
import User from '../models/userModel.js';
import Group from '../models/groupModel.js';
import ApiResponse from '../utils/apiResponse.js';

export const createAppointment = errorHandler(async (req, res, next) => {
    try {
        // Create initial appointment without ratings
        const appointment = await Appointment.create({
            user: req.user.id,
            ...req.body,
            status: 'pending',
            rating: []
        });

        if (!appointment) {
            return res.status(400).json(
                new ApiResponse('fail', 'Appointment not created')
            );
        }

        // Handle group-based appointments
        if (req.body.group) {
            const group = await Group.findById(req.body.group);
            if (!group) {
                return res.status(404).json(
                    new ApiResponse('fail', 'Group not found')
                );
            }

            // Check permissions
            if (req.user.role !== 'admin' && 
                group.admin.toString() !== req.user.id && 
                req.user.role !== 'super-admin') {
                return res.status(403).json(
                    new ApiResponse('fail', 'Only group admins or super admins can create group appointments')
                );
            }

            // Add group members to attendance
            appointment.attendance = group.members.map(member => member._id);
            appointment.group = req.body.group;
            group.Appointments.push(appointment._id);
            await group.save();
        }

        // Initialize ratings for all attendees
        const attendees = appointment.attendance || [];
        if (!attendees.includes(req.user.id)) {
            attendees.push(req.user.id); // Include creator if not in attendance
        }

        const initialRatings = attendees.map(userId => ({
            ratedUser: [userId],
            ratedBy: req.user.id,
            ratingTypes: req.body.rating.map(type => ({
                title: type.title,
                points: 0,
                hasRated: false,
                comment: ''
            })),
        }));

        // Update appointment with ratings
        appointment.rating = initialRatings;
        await appointment.save();

        // Return populated appointment
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('user', 'name email')
            .populate('attendance', 'name email')
            .populate('rating', 'name email')
           

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



export const getAppointmentsByStatus = errorHandler(async (req, res) => {
    // Get user with populated appointments
    const user = await User.findById(req.user.id)
        .populate({
            path: 'appointments',
            populate: [
                { path: 'user', select: 'name email' },
                { path: 'acceptedBy', select: 'name email' }
            ]
        });

    if (!user || !user.appointments.length) {
        return res.status(404).json(
            new ApiResponse('fail', 'No appointments found for this user', {
                currentAndUpcoming: { active: [], inactive: [] },
                expired: []
            })
        );
    }

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Update status for all user appointments
    const updatedAppointments = await Promise.all(user.appointments.map(async (appointment) => {
        if (appointment.endingdate) {  
            // Ranged appointment
            if (currentDate > appointment.endingdate || 
                (currentDate === appointment.endingdate && currentTime > appointment.endingtime)) {
                appointment.status = 'expired';
            } else if (currentDate >= appointment.startingdate && 
                      currentDate <= appointment.endingdate && 
                      currentTime >= appointment.startingtime && 
                      currentTime <= appointment.endingtime) {
                appointment.status = 'active';
            } else {
                appointment.status = 'inactive';
            }
        } else {
            // Single day appointment
            if (currentDate > appointment.startingdate || 
                (currentDate === appointment.startingdate && currentTime > appointment.endingtime)) {
                appointment.status = 'expired';
            } else if (currentDate === appointment.startingdate && 
                      currentTime >= appointment.startingtime && 
                      currentTime <= appointment.endingtime) {
                appointment.status = 'active';
            } else {
                appointment.status = 'inactive';
            }
        }
        await appointment.save();
        return appointment;
    }));

    // Group appointments by status
    const activeAndInactive = updatedAppointments.filter(app => 
        ['active', 'inactive'].includes(app.status)
    );
    const expired = updatedAppointments.filter(app => app.status === 'expired');

    return res.status(200).json({
        status: 'success',
        message: 'Appointments retrieved successfully',
        data: {
            currentAndUpcoming: {
                active: activeAndInactive.filter(app => app.status === 'active'),
                inactive: activeAndInactive.filter(app => app.status === 'inactive')
            },
            expired: expired.sort((a, b) => 
                new Date(b.startingdate) - new Date(a.startingdate)
            )
        }
    });
});

const checkAppointmentStatus = async (appointmentId) => {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        throw new Error('Appointment not found');
    }

    // Get current date and time in Egypt timezone (UTC+2)
    const now = new Date();
    const egyptTime = new Date(now.getTime());
    
    // Format current date and time as strings
    const currentDate = egyptTime.toISOString().split('T')[0];
    const currentTime = egyptTime.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Cairo'
    });

    let newStatus = 'inactive';
    const RangedDate = Boolean(appointment.endingdate);

   if (RangedDate) {
    if (currentDate < appointment.startingdate) {
        newStatus = 'inactive';
    } else if (currentDate > appointment.endingdate) {
        newStatus = 'expired';
    } else if (currentDate === appointment.startingdate) {
        // On the starting date, check time
        if (currentTime >= appointment.startingtime && currentTime <= appointment.endingtime) {
            newStatus = 'active';
        } else if (currentTime < appointment.startingtime) {
            newStatus = 'inactive';
        } else {
            newStatus = 'expired';
        }
    } else if (currentDate === appointment.endingdate) {
        // On the ending date, check time
        if (currentTime >= appointment.startingtime && currentTime <= appointment.endingtime) {
            newStatus = 'active';
        } else if (currentTime < appointment.startingtime) {
            newStatus = 'inactive';
        } else {
            newStatus = 'expired';
        }
    } else {
        // Date is strictly between start and end dates
        newStatus = 'active';
    }
} else {
        // Single day appointment logic using string comparison
        if (currentDate < appointment.startingdate) {
            newStatus = 'inactive';
        } else if (currentDate > appointment.startingdate) {
            newStatus = 'expired';
        } else {
            // Same day
            if (currentTime >= appointment.startingtime && currentTime <= appointment.endingtime) {
                newStatus = 'active';
            } else if (currentTime < appointment.startingtime) {
                newStatus = 'inactive';
            } else {
                newStatus = 'expired';
            }
        }
    }

    console.log('Status determined:', newStatus);

    if (appointment.status !== newStatus) {
        appointment.status = newStatus;
        await appointment.save();
    }

    return { status: newStatus, appointment, RangedDate };
};
export const startRating = errorHandler(async (req, res) => {
    const result = await checkAppointmentStatus(req.params.id);
    if(!result) {
        return res.status(404).json(
            new ApiResponse('fail', 'Appointment not found', null)
        );
    }
    // Get appointment status and details
    const { status, appointment, RangedDate } = result;
   
    if (req.user.role !== 'admin' && 
        appointment.rating.ratedUser.toString() !== req.user.id && 
        req.user.role !== 'super-admin') {
        return res.status(403).json(
            new ApiResponse('fail', 'Only group admins or super admins can create group appointments',null)
        );
    }
    
    if (status !== 'active') {
        return res.status(400).json(
            new ApiResponse('fail', 'Rating only allowed during active appointments', null)
        );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    if (RangedDate) {
        // Check if already rated today for ranged appointments
        const ratedToday = appointment.rating.some(r => 
            r.ratedBy.toString() === req.user.id && 
            r.ratedAt?.toISOString().split('T')[0] === today
        );

        if (ratedToday) {
            return res.status(400).json(
                new ApiResponse('fail', 'You have already rated this appointment today', null)
            );
        }
    } else {
        // For single-day appointments, check if already rated
        const hasRated = appointment.rating.some(r => 
            r.ratedBy.toString() === req.user.id && 
            r.hasRated
        );

        if (hasRated) {
            return res.status(400).json(
                new ApiResponse('fail', 'You have already rated this appointment', null)
            );
        }
    }

    
    // Create new rating
    const newRating = {
        ratedUser: req.body.id,
        ratedBy: req.user.id,
        rating: req.body.rating,
        comment: req.body.comment || '',
        attendance: appointment.acceptedBy ,
        points: req.body.points,
        hasRated: true,
        cumulativeRatingPoints: req.body.points.map(point => point.points).reduce((acc, curr) => acc + curr, 0),
        ratedAt: new Date()
    };

    // Add new rating to array
    appointment.rating.push(newRating);
    await appointment.save();

    // Return populated appointment
    const updatedAppointment = await Appointment.findById(appointment._id)
        .populate('user', 'name email')
        .populate('rating.ratedUser', 'name email')
        .populate('rating.ratedBy', 'name email');

    return res.status(200).json(
        new ApiResponse(
            'success', 
            RangedDate ? 'Daily rating submitted successfully' : 'Rating submitted successfully',
            updatedAppointment
        )
    );
});  

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
