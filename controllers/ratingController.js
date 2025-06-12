import Rating from '../models/ratingModel.js';
import errorHandler from '../middlewares/errorHandler.js';

export const createRating = errorHandler(async (req, res) => {
    const rating = await Rating.create(req.body);
    res.status(201).json(rating);
});

export const getRatings = errorHandler(async (req, res) => {
    const ratings = await Rating.find();
    if(!ratings){
        res.status(404).json({message: 'No ratings found'}
        );}
    res.json(ratings);
});

export const updateRatings = errorHandler(async (req, res) => {
    const rating = await Rating.findByIdAndUpdate(req.body)
    if(rating){
        res.json(rating);
    }else{
        res.status(404).json({message: 'Rating not found'});
    }

});

export const deleteRating = errorHandler(async (req, res) => {
    const rating = await Rating.findByIdAndDelete(req.params.id);
    if(rating){
        res.json({message: 'Rating deleted successfully'});
    }else{
        res.status(404).json({message: 'Rating not found'} );
    } } );
    export const startRating = errorHandler(async (req, res) => {
    // Use computedStatus instead of status field
    const appointment = await Appointment.findById(req.params.id)
        .populate('user', 'name email')
        .populate('attendance', 'name email')
        .populate('rating.ratedUser', 'name email')
        .populate('rating.ratedBy', 'name email');

    if (!appointment) {
        return res.status(404).json(
            new ApiResponse('fail', 'Appointment not found')
        );
    }

    // Use computedStatus to check if appointment is active
    if (appointment.computedStatus !== 'active') {
        return res.status(400).json(
            new ApiResponse('fail', 'Appointment is not active')
        );
    }

    // Permission check
    if (
        req.user.role !== 'admin' &&
        req.user.role !== 'super-admin' &&
        (!appointment.rating.length ||
            !appointment.rating.some(r => r.ratedUser.toString() === req.user.id))
    ) {
        return res.status(403).json(
            new ApiResponse('fail', 'Only group admins, super admins, or attendees can rate this appointment', null)
        );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Determine if appointment is ranged
    const isRanged = !!appointment.endingdate && appointment.endingdate !== appointment.startingdate;

    if (isRanged) {
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
        attendance: appointment.acceptedBy,
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
            isRanged ? 'Daily rating submitted successfully' : 'Rating submitted successfully',
            updatedAppointment
        )
    );
});