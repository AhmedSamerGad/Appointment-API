import mongoose from "mongoose";
import ratingSchema from "./ratingModel.js";

const AppointmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    },
    startingdate: {
        type: String,
        required: true,
    },
    endingdate: {
        type: String,
       
    },
    startingtime: {
        type: String,
    },
    endingtime: {
        type: String,
    },
    //for the admin
    status: {
        type: String,
        enum: ['pending', 'rejected','inactive','active','expired', 'completed'],
        default: 'pending'
    },
    attendance: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    acceptedBy : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    rating:[ratingSchema]
},{timestamps: true});

AppointmentSchema.pre('save', function (next) {
    if (this.isNew || this.isModified('startingdate') || this.isModified('startingtime')) {
        const now = new Date();
        const startDate = new Date(`${this.startingdate}T${this.startingtime || '00:00'}`);

        // Only allow creating appointments if the start date is in the future
        if (startDate > now) {
            return next();
        } else {
            return next(new Error('Cannot create an appointment in the past or for the current time.'));
        }
    }
    // Allow updates without this check
    next();
});

// AppointmentSchema.virtual('computedStatus').get(function () {
//   const now = new Date();

//   if (!this.startingdate) return this.status;

//   const isOneDay = !this.endingdate || this.endingdate === this.startingdate;

//   const startTime = this.startingtime || '00:00';
//   const endTime = this.endingtime || '23:59';

//   const start = new Date(`${this.startingdate}T${startTime}`);
//   const end = isOneDay
//     ? new Date(`${this.startingdate}T${endTime}`)
//     : new Date(`${this.endingdate}T${endTime}`);

//   if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//     return this.status;
//   }

//   if (now < start) return 'inactive';
//   if (now >= start && now <= end) return 'active';
//   if (now > end) return 'expired';

//   return this.status; // fallback
// });


const Appointment = mongoose.model('Appointment', AppointmentSchema);

export default Appointment;
