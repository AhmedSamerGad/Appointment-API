import express from 'express';
import dotenv from 'dotenv';
import globalError from './middlewares/globleError.js';
import appointmentRoute from './routes/appointmentRoute.js';
import userRoute from './routes/userRoute.js';
import groupRoute from './routes/groupRoute.js';
import adminRoute from './routes/adminRoure.js';
import {connectDB} from './config/database_conig.js';
import cors from 'cors';

dotenv.config();
connectDB();    
const app = express();

app.use(express.json());

app.use(cors());

app.use('/api/v1/appointment',appointmentRoute);
app.use('/api/v1/user',userRoute);
app.use('/api/v1/group',groupRoute);
app.use('/api/v1/admin',adminRoute);


app.use(globalError);

app.all('*',(req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
})

app.listen(process.env.Port,'0.0.0.0',()=>{
    console.log(`Server is running on port ${process.env.Port}`);
});