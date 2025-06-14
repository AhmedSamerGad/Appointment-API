import mongoose from "mongoose";

const userSchema = new mongoose.Schema({ 
    email: { type: String, required: [true,'email is required'], unique: true },
    password: { type: String, required: [true,'password is required'] ,minlength: [6, 'Too short password'],
    },
    name: { type: String, required: [true,'name is required'] },
    phone: { type: String},
    gender: { type: String, required: [true,'gender is required'],enum: ['male','female'] , default: 'male' },
    appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    token: { type: String },
    role: { type: String,enum:['user','admin','super-admin'] ,default: 'user' },
    profilePic: { type: String, default: 'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png' },
    
},{timestamps: true});
// check if the super admin is existing 
userSchema.pre('save', async function(next){
    if(this.isNew && this.role == 'super-admin'){
        const existingUser = await mongoose.model('User').findOne({role: 'super-admin'});
        if(existingUser){
            return next(new Error('Super Admin already exists'));
        }
    }
    next();
});

const User = mongoose.model('User', userSchema);

export default User;
