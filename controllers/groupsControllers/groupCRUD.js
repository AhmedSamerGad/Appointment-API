import  errorHandler  from '../../middlewares/errorHandler.js';
import Group from '../../models/groupModel.js';
import ApiResponse from '../../utils/apiResponse.js';
import User from '../../models/userModel.js';

export const getUserGroups = errorHandler(async (req, res, next) => {
  const userId = req.user.id; // Get user ID from authenticated user

  const groups = await Group.find({
    $or: [
      { members: userId }, // User is a member
      { admin: userId }, // User is an admin
    ],
  })
    .populate("members", "name profilePic")
    .sort({ createdAt: -1 });

  if (!groups || groups.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse("fail", "No groups found for this user"));
  }

  res
    .status(200)
    .json(new ApiResponse("success", "Groups retrieved successfully", groups));
});
export const createGroup = errorHandler(async (req, res, next) => {
  const group = await Group.create(req.body);
  if (!group) {
    const error = res
      .status(400)
      .json(new ApiResponse("fail", "Group not created"));
    return next(error);
  }
  res
    .status(201)
    .json(new ApiResponse("success", "Group created successfully", group));
});

export const updateGroup = errorHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res
      .status(404)
      .json(new ApiResponse("fail", "Group not found"));
  }

  // Update other group fields except members
  const { members, ...otherFields } = req.body;
  Object.assign(group, otherFields);

  // If members are provided, add only new members without removing old ones
  if (members && Array.isArray(members)) {
    const existingMembers = group.members.map(m => m.toString());
    const membersToAdd = members
      .map(m => m.toString())
      .filter(m => !existingMembers.includes(m)); // Only add new members

    group.members.push(...membersToAdd); // Append new members to the existing list

    // Update User documents for added members
    await User.updateMany(
      { _id: { $in: membersToAdd } },
      { $addToSet: { groups: group._id } }
    );
  }

  await group.save();

  const updatedGroup = await Group.findById(group._id)
    .populate("members", "name email")
    .populate("admin", "name email");

  res.status(200).json(new ApiResponse("success", "Group updated successfully", updatedGroup));
});

export const deleteGroup = errorHandler(async (req, res, next) => {
  const group = await Group.findByIdAndDelete(req.params.id);
  if (!group) {
    const error = res
      .status(404)
      .json(new ApiResponse("fail", "Group not found"));
  }
  res.status(204).json(new ApiResponse("success", "Group deleted successfully", null));
});