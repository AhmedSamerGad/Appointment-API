import Appointment from "../models/appointmentModel.js";
import errorHandler from "../middlewares/errorHandler.js";
import Group from "../models/groupModel.js";
import ApiResponse from "../utils/apiResponse.js";
export const createAppointment = errorHandler(async (req, res, next) => {
  try {
    let attendance = [];
    let groupIds = [];
    const ratingType = req.body.rating;

    // Handle group-based appointments
    if (req.body.group && Array.isArray(req.body.group)) {
      for (const groupId of req.body.group) {
        const group = await Group.findById(groupId);
        if (!group) {
          return res
            .status(404)
            .json(new ApiResponse("fail", "Group not found"));
        }
         if (
        req.user.role !== "admin" &&
        group.admin.toString() !== req.user.id &&
        req.user.role !== "super-admin"
      ) {
        return res
          .status(403)
          .json(
            new ApiResponse(
              "fail",
              "Only group admins or super admins can create group appointments"
            )
          );
      }
        // Collect all group members
        attendance.push(...group.members.map((member) => member._id.toString()));
        groupIds.push(group._id.toString());
      }
    } else {
      attendance = req.body.attendance ? req.body.attendance.map(String) : [];
    }

    // Always include creator in attendance if not already present
    if (!attendance.includes(req.user.id)) {
      attendance.push(req.user.id);
    }

    // Remove duplicates
    attendance = [...new Set(attendance)];

    // Prepare initial ratings for all attendees
    const initialRatings = {
      ratedBy: req.user.id,
      hasRated: false,
      ratedAt: Date.now(),
      users: attendance.map((userId) => ({
        ratedUser: userId,
        cumulativeRatingPoints: 0,
        comment: req.body.comment || "",
        reviews: ratingType.map((review) => ({
          title: review.title,
          points: review.points || 0,
        })),
      })),
    };

    // Create appointment with all fields set
    const appointment = await Appointment.create({
      user: req.user.id,
      ...req.body,
      attendance,
      group: groupIds,
      status: "pending",
      rating: initialRatings,
    });

    // Optionally, add appointment to each group
    if (groupIds.length > 0) {
      await Group.updateMany(
        { _id: { $in: groupIds } },
        { $push: { Appointments: appointment._id } }
      );
    }

    // Return populated appointment
    const populatedAppointment = await Appointment.findById(
      appointment._id
    ).populate("user", "name email");

    return res
      .status(201)
      .json(
        new ApiResponse(
          "success",
          "Appointment created successfully",
          populatedAppointment
        )
      );
  } catch (error) {
    console.error("Create appointment error:", error);
    return res
      .status(500)
      .json(
        new ApiResponse("fail", "Error creating appointment", error.message)
      );
  }
});
// for use in app only

export const updateAppointment = errorHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  if (appointment) {
    res.json(appointment);
  } else {
    res.status(404).json({ message: "Appointment not found" });
  }
});

export const deleteAppointment = errorHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (appointment) {
    res.json({ message: "Appointment deleted successfully" });
  } else {
    res.status(404).json({ message: "Appointment not found" });
  }
});

export const getAppointmentsForCurrentUser = errorHandler(async (req, res) => {
  // Use req.user.id for the current authenticated user
  const appointments = await Appointment.find({ user: req.params.id });

  if (!appointments || appointments.length === 0) {
    return res.status(404).json({
      status: "fail",
      result: 0,
      data: [],
    });
  }

  return res.status(200).json({
    status: "success",
    result: appointments.length,
    data: appointments,
  });
});

export const calculateComputedStatus = (appointment) => {
  const now = new Date();
  const isOneDay =
    !appointment.endingdate ||
    appointment.endingdate === appointment.startingdate;

  const startTime = appointment.startingtime || "00:00";
  const endTime = appointment.endingtime || "23:59";

  const start = new Date(`${appointment.startingdate}T${startTime}`);
  const end = isOneDay
    ? new Date(`${appointment.startingdate}T${endTime}`)
    : new Date(`${appointment.endingdate}T${endTime}`);

  if (
    isNaN(start.getTime()) ||
    isNaN(end.getTime()) ||
    appointment.status === "pending" ||
    appointment.status === "rejected" ||
    appointment.status === "completed"
  )
    return appointment.status;

  if (now < start) return "inactive";
  if (now >= start && now <= end) return "active";
  if (now > end) return "expired";

  return appointment.status;
};
