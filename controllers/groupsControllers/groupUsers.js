import Group from "../../models/groupModel.js";
import ApiResponse from "../../utils/apiResponse.js";
import errorHandler from "../../middlewares/errorHandler.js";


export const getGroupUsers = errorHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    const error = res
      .status(404)
      .json(new ApiResponse("fail", "Group not found"));
    return next(error);
  }
  res.status(200).json(new ApiResponse("success", "", group.members));
});
export const addGroupUser = errorHandler(async (req, res, next) => {
  const { members } = req.body;
  const groupId = req.params.id;

  // Validate members array
  if (!members || !Array.isArray(members) || members.length === 0) {
    return res
      .status(400)
      .json(new ApiResponse("fail", "Please provide an array of member IDs"));
  }

  // Find group and validate admin
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json(new ApiResponse("fail", "Group not found"));
  }

  try {
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
            "Only group admins can add members or super admins"
          )
        );
    }
    // Check for existing members
    const existingMembers = group.members.map((member) => member.toString());
    const duplicateMembers = members.filter((member) =>
      !existingMembers.includes(member)
    );

    if (duplicateMembers.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            "fail",
            "All provided users are already members of the group"
          )
        );
    }

    // Add new members
    group.members.push(...duplicateMembers);
    await group.save();

    await User.updateMany(
      { _id: { $in: members } },
      { $addToSet: { groups: groupId } }
    );

    // Populate member details in response
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "name email")
      .populate("admin", "name email");

    return res
      .status(200)
      .json(
        new ApiResponse(
          "success",
          "Users added to group successfully",
          updatedGroup
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse("error", "Error adding members to group"));
  }
});
export const deleteGroupUser = errorHandler(async (req, res, next) => {
  const { members } = req.body;
  const groupId = req.params.id;

  // Validate members array
  if (!members || !Array.isArray(members) || members.length === 0) {
    return res
      .status(400)
      .json(new ApiResponse("fail", "Please provide an array of member IDs"));
  }

  // Find group
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json(new ApiResponse("fail", "Group not found"));
  }
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
  // Remove specified members from group
  const updatedMembers = group.members.filter(
    (member) => !members.includes(member.toString())
  );
  if (updatedMembers.length === group.members.length) {
    return res
      .status(400)
      .json(new ApiResponse("fail", "No specified members were removed"));
  }

  group.members = updatedMembers;
  await group.save();
  await User.updateMany(
    { _id: { $in: members } },
    { $pull: { groups: groupId } }
  );

  // Populate member details in response
  const updatedGroup = await Group.findById(groupId)
    .populate("admin", "name email")
    .populate("members", "name email");

  res
    .status(200)
    .json(
      new ApiResponse(
        "success",
        "Specified members removed from group",
        updatedGroup
      )
    );
});