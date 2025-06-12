import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({ 
    name: {
        type: String,
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    groupPic: {
        type: String,
        default: 'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png'
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    description: {
        type: String
    },
    Appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    createdOn: {
        type: Date,
        default: Date.now
    },

},{timestamps: true});

const Group = mongoose.model('Group', GroupSchema);

export default Group;