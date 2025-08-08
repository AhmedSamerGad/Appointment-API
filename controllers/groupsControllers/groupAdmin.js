import Group from "../../models/groupModel.js";
import User from "../../models/userModel.js";
import errorHandler from "../../middlewares/errorHandler.js";
import ApiResponse from "../../utils/apiResponse.js";

export const getGroupAdmin = errorHandler(async (req, res) => {
  const group = await Group.findById(req.params.id).populate("admin", "name email role").sort({ admin: -1 }); 
  if (!group) {
    return res
      .status(404)
      .json(new ApiResponse("fail", "Group not found"));
  }
 
  res.status(200).json(new ApiResponse("success", group.admin ? "Admin retrieved successfully" : "No admin found for this group", group.admin));
});
export const getAdminForGroups = errorHandler(async (req, res, next) => {
  const userId = req.params.userId;
  // Find all groups where the user is the admin
  const groups = await Group.find({ admin: userId }).populate("admin", "name email role profilePic").populate("members", "name profilePic");
  if (!groups || groups.length === 0) {
    return res.status(200).json(new ApiResponse("fail", "User is not admin for any group", null));
  }
  res.status(200).json(
    new ApiResponse(
      "success",  
      "User is admin for one or more groups",
      { isAdmin: true, groups }
    )
  );
});
// i want to check the admin is in the group
export const updateAdminGroup = errorHandler(async (req, res, next) => {
  try {
    // Step 1: Validate request body
    if (!req.body.admin) {
      return res
        .status(400)
        .json(new ApiResponse("fail", "New admin ID is required", null));
    }

    // Step 2: Find group and check if exists
    const group = await Group.findById(req.params.userId)
      .populate("admin", "name email role")
      .populate("members", "name profilePic");

    if (!group) {
      return res
        .status(404)
        .json(new ApiResponse("fail", "Group not found", null));
    }

    // Step 3: Check permissions
    if (
      req.user.role !== "super-admin" &&
      group.admin._id.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json(
          {status: "fail", message: "Only super admins or group admins can update the admin"}
        );
    }

    // Step 4: Store old admin ID for later use
    const oldAdminId = group.admin._id;

    // Step 5: Check if new admin is a member
    if (
      !group.members.some((member) => member._id.toString() === req.body.admin)
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            "fail",
            "New admin must be a member of the group",
            null
          )
        );
    }

    // Step 6: Check if new admin exists
    const newAdmin = await User.findById(req.body.admin);
    if (!newAdmin) {
      return res
        .status(404)
        .json(new ApiResponse("fail", "New admin user not found", null));
    }

    // Step 7: Update group's admin
    group.admin = req.body.admin;
    await group.save();

    // Step 8: Update new admin's role and group
    await User.findByIdAndUpdate(
      req.body.admin,
      {
        role: "admin",
        $addToSet: { groups: req.params.id },
      },
      { new: true }
    );

    // Step 9: Check if old admin is admin in other groups
    const otherGroupsWithOldAdmin = await Group.findOne({
      _id: { $ne: req.params.id },
      admin: oldAdminId,
    });

    // Step 10: If old admin has no other groups, change role to user
    if (!otherGroupsWithOldAdmin) {
      await User.findByIdAndUpdate(oldAdminId, {
        role: "user",
      });
    }

    // Step 11: Get updated group with populated fields
    const updatedGroup = await Group.findById(group._id)
      .populate("admin", "name email role groups")
      .populate("members", "name email");

    return res
      .status(200)
      .json(
        new ApiResponse("success", "Admin updated successfully", updatedGroup)
      );
  } catch (error) {
    console.error("Update admin error:", error);
    return res
      .status(500)
      .json(
        new ApiResponse("fail", "Error updating group admin", error.message)
      );
  }
});



// export const addGroupPost = errorHandler(async (req, res, next) => {
//   try {
//     const appointmentData = req.body.Appointment;
//     if (
//       req.user.role !== "admin" &&
//       req.user.role !== "super-admin" &&
//       group.admin.toString() !== req.user.id
//     ) {
//       return res
//         .status(403)
//         .json(
//           new ApiResponse(
//             "fail",
//             "Only group admins or super admins can add appointments",
//             []
//           )
//         );
//     }

//     // Validate appointment data
//     if (
//       !appointmentData ||
//       !appointmentData.title ||
//       !appointmentData.user ||
//       !appointmentData.startingdate
//     ) {
//       return res
//         .status(400)
//         .json(
//           new ApiResponse(
//             "fail",
//             "Title, user ID and starting date are required"
//           )
//         );
//     }

//     // Create new appointment document
//     const appointment = await Appointment.create({
//       title: appointmentData.title,
//       user: appointmentData.user,
//       startingdate: appointmentData.startingdate,
//       status: "pending",
//       attendance: appointmentData.attendance || [],
//       ...req.body,
//     });

//     // Add all group members to the appointment's attendance
//     const group = await Group.findById(req.params.id).populate(
//       "members",
//       "_id"
//     );
//     if (group) {
//       group.Appointments.push(appointment._id);
//       await group.save();
//       appointment.attendance = group.members.map((member) => member._id);
//       await appointment.save();
//     } else {
//       // Delete the created appointment if group not found
//       await Appointment.findByIdAndDelete(appointment._id);
//       return res.status(404).json(new ApiResponse("fail", "Group not found"));
//     }

//     res
//       .status(200)
//       .json(
//         new ApiResponse(
//           "success",
//           "Appointment added successfully",
//           appointment
//         )
//       );
//   } catch (error) {
//     console.error("Add appointment error:", error);
//     return res
//       .status(400)
//       .json(
//         next(new ApiResponse("fail", "Error adding appointment", error.message))
//       );
//   }
// });



