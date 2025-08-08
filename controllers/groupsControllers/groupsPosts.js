import  errorHandler from "../../middlewares/errorHandler.js";
import Group from "../../models/groupModel.js";
import ApiResponse from "../../utils/apiResponse.js";
import Appointment from "../../models/appointmentModel.js";
import User from "../../models/userModel.js";

export const getGroupPosts = errorHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)
    .populate("Appointments")
    .select("startingdate ");
  if (!group) {
    const error = res
      .status(404)
      .json(new ApiResponse("fail", "Group not found"));
    return next(error);
  }
  res.status(200).json(new ApiResponse("success", "", group.Appointments));
});

export const deleteGroupPost = errorHandler(async (req, res, next) => {
  const appointment = req.body.appointment; //appointment id
  if (
    req.user.role !== "admin" ||
    group.admin.toString() !== req.user.id ||   
    req.user.role !== "super-admin"
  ) {
    return res
      .status(403)
      .json(
        new ApiResponse(
          "fail",
          "Only group admins can add members or super admins"
        )
      );
  }
  const group = await Group.findByIdAndUpdate(
    req.params.id,
    { $pull: { Appointments: appointment } },
    { new: true }
  );
  if (!group) {
    const error = res
      .status(404)
      .json(new ApiResponse("fail", "Group not found"));
    return next(error);
  }
  res.status(200).json(new ApiResponse("success", group.Appointments));
});

export const acceptAppointment = errorHandler(async (req, res) => {
  const  appointmentId  = req.params.appointmentId;
  const userId = req.user.id;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res
        .status(404)
        .json({ status: "fail", message: "Appointment not found" });
    }

    // Check if user already accepted
    if (appointment.acceptedBy.includes(userId) || !appointment.attendance.includes(userId)) {
      return res
        .status(400)
        .json(
          {
            status: "fail",
            message: "You have already accepted this appointment or you are not form attending"
          }
        );
    }

    // Add user to acceptedBy array correctly
    appointment.acceptedBy.push(userId);
    await appointment.save();

    // Add appointment to user's appointments using atomic operation
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { appointments: appointmentId } },
      { new: true }
    );

    // Get updated appointment with populated data
    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("acceptedBy.user", "name email")
      .populate("user", "name email");

    return res
      .status(200)
      .json({
        status: "success",
        message: "Appointment accepted successfully",
        data: updatedAppointment
      });
  } catch (error) {
    console.error("Accept appointment error:", error);
    return res
      .status(400)
      .json({
        status: "fail",
        message: "Error accepting appointment",
        error: error.message
      });
  }
});
