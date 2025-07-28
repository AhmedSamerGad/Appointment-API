import Appointment from "../models/appointmentModel.js";
import errorHandler from "../middlewares/errorHandler.js";
import Group from "../models/groupModel.js";
import Users from "../models/userModel.js";
import ApiResponse from "../utils/apiResponse.js";
import { processGroupsAndAttendance ,calculateComputedStatus} from "../utils/helperFunctions.js";
export const createAppointment = errorHandler(async (req, res, next) => {
  try {
    const { attendance, groupIds } = await processGroupsAndAttendance(
      req.user,
      req.body.group,
      req.body.attendance
    );

    let rating = [];
    if (req.body.rating && Array.isArray(req.body.rating)) {
      rating = [
        {
          ratedBy: req.user.id,
          hasRated: false,
          ratedAt: new Date(),
          users: [
            { 
              ratedUser: req.user.id,  
              comment: "",
              cumulativeRatingPoints: 0,
              reviews: req.body.rating,
            },
          ],
        },
      ];
    }

    const appointment = await Appointment.create({
      user: req.user.id,
      ...req.body,
      attendance,
      group: groupIds,
      status: "pending",
      rating,
    });

    if (groupIds.length > 0) {
      await Group.updateMany(
        { _id: { $in: groupIds } },
        { $push: { Appointments: appointment._id } }
      );
    }

    const populatedAppointment = await Appointment.findById(appointment._id);

    return res.status(201).json(
      new ApiResponse("success", "Appointment created successfully", populatedAppointment)
    );
  } catch (error) {
    console.error("Create appointment error:", error);
    return res.status(500).json(
      new ApiResponse("fail", "Error creating appointment", error.message)
    );
  }
});

// for use in app only
export const updateAppointment = errorHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      status: "fail",
      message: "Appointment not found",
    });
  }

  // Update acceptedBy users without duplication
  if (req.body.acceptedBy && Array.isArray(req.body.acceptedBy)) {
    const currentAcceptedIds = appointment.acceptedBy.map(id => id.toString());
    const incomingIds = req.body.acceptedBy.map(id => id.toString());

    const updatedAcceptedBy = [...new Set([...currentAcceptedIds, ...incomingIds])];
    appointment.acceptedBy = updatedAcceptedBy;

    // Update rating.users based on new acceptedBy list
    if (appointment.rating && appointment.rating.length > 0) {
      const rating = appointment.rating[0];

      const templateReviews = rating.users?.[0]?.reviews || [];
      rating.users = updatedAcceptedBy.map(userId => ({
        ratedUser: userId,
        cumulativeRatingPoints: 0,
        comment: "",
        reviews: templateReviews,
      }));
      const user = req.body.acceptedBy.map(async(userId) => {
        const currentUser = await Users.findById(userId);
        currentUser.appointments.push(appointment._id);
        await currentUser.save();
      }); 

      appointment.markModified("rating");
    }
  }

  // Update other allowed fields like status
  if (req.body.status) {
    appointment.status = req.body.status;
  }

  await appointment.save();
const timestamps = Date.now().toLocaleString('en-US', {
  timeZone: 'Africa/Cairo',
}); 
  return res.status(200).json({
    status: "success",
    data: appointment,
    time : timestamps,
  });
});


export const deleteAppointment = errorHandler(async (req, res) => { 
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (appointment) {
    await Users.updateMany(
      { appointments: appointment._id },
      { $pull: { appointments: appointment._id } }
    );
    res.json({ message: "Appointment deleted successfully" });
  } else {
    res.status(404).json({ message: "Appointment not found" });
  }
});

export const getAppointmentsForCurrentUser = errorHandler(async (req, res) => {
  // Find appointments where the user is either the creator or in attendance
  const appointments = await Appointment.find({
    $or: [  
      { user: req.params.id },
      { attendance: req.params.id }
    ]
  }).populate('acceptedBy', 'name profilePic');

  if (!appointments || appointments.length === 0) {
    return res.status(404).json({
      status: "fail",
      result: 0,
      data: [],
    });
  }

  appointments.forEach(app => {
    app.status = calculateComputedStatus(app);
  });

  return res.status(200).json({
    status: "success",
    result: appointments.length,
    data: appointments,
  });
});
