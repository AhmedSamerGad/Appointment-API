import Group from "../../models/groupModel.js";
import ApiResponse from "../../utils/apiResponse.js";
import User from "../../models/userModel.js";
import errorHandler from "../../middlewares/errorHandler.js";


export const getGroupUsers = errorHandler(async (req, res) => {
  const group = await Group.findById(req.params.groupId).populate("members", "name role profilePic");
  if (!group) {
     res
      .status(404)
      .json(new ApiResponse("fail", "Group not found"));
  }
  res.status(200).json(new ApiResponse("success",'' , group.members.length == 0  ? 'No members found' : group.members));
});
export const addGroupUser = errorHandler(async (req, res) => {
  const { members } = req.body;
  const groupId = req.params.groupId;

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
          new ApiResponse("fail", "Only group admins or super admins can add members")
        );
    }
    // Check for existing members
    const existingMembers = group.members.map((member) => member.toString());
    const membersToAdd = members
      .map(m => m.toString())
      .filter(ma => !existingMembers.includes(ma)); 
    if (membersToAdd.length === 0) {
      return res
        .status(400)
        .json(new ApiResponse("fail", "No new members to add, all specified members are already in the group"));
    }

    // Add new members
    group.members.push(...membersToAdd);
    await group.save(); 

    await User.updateMany(
      { _id: { $in: membersToAdd } },
      { $addToSet: { groups: groupId } }
    );

    // Populate member details in response
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "name role profilePic")
      .populate("admin", "name role profilePic");

    return res
      .status(200)
      .json(
        new ApiResponse("success", "Members added to group successfully", updatedGroup)
      );
  } catch (error) {
    return res
      .status(400)
      .json(new ApiResponse("error", "Error adding members to group"));
  }
});
export const deleteGroupUser = errorHandler(async (req, res) => {
  const { members } = req.body;
  const groupId = req.params.groupId;

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
  // Remove specified members from group
  const updatedMembers = group.members.filter(
    (member) => !members.includes(member.toString())
  );
  if (updatedMembers.length === group.members.length) {
    return res
      .status(400)
      .json({status:'fail', message: 'No members removed, all specified members are not in the group'});
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