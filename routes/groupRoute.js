import express from "express";
import * as groupController from "../controllers/groupController.js";
import {
  createGroupValidator,
  updateAdminGroupValidator,
  updatedGroupValidator,
  removeGroupUserValidator,
  addGroupPostsValidator,
  addGroupUserValidator,
  
} from "../utils/validators/groupValidator.js";
import verifyToken from "../middlewares/verifyToken.js";
import allowedTo from "../middlewares/allowedTo.js";

const groupRoute = express.Router();
groupRoute.use(verifyToken);

groupRoute
  .route("/")
  .post(
    allowedTo("super-admin"),
    createGroupValidator,
    groupController.createGroup
  )
  .get(groupController.getUserGroups);
// i want to check the admin is the group admin only
groupRoute
  .route("/:id")
  .patch(
    allowedTo("super-admin", "admin"),
    updatedGroupValidator,
    groupController.updateGroup
  ).get(groupController.getAdminForGroups)
  .delete(allowedTo("super-admin"), groupController.deleteGroup);
groupRoute
  .route("/:id/admin")
  .patch(
    allowedTo("super-admin"),
    updateAdminGroupValidator,
    groupController.updateAdminGroup
  )
  .get(groupController.getGroupAdmin);
groupRoute
  .route("/:id/users")
  .get(groupController.getGroupUsers)
  .post(
    allowedTo("admin", "super-admin"),
    addGroupUserValidator,
    groupController.addGroupUser
  )
  .delete(
    allowedTo("admin", "super-admin"),
    removeGroupUserValidator,
    groupController.deleteGroupUser
  );
// post for the group id , get for the group id ,delete for the group id
groupRoute
  .route("/:id/appointment")
  .post(
    allowedTo("admin", "super-admin"),
    addGroupPostsValidator,
    groupController.addGroupPost
  )
  .get(groupController.getGroupPosts)
  .delete(allowedTo("admin", "super-admin"), groupController.deleteGroupPost);
groupRoute.post("/:appointmentId/accept", groupController.acceptAppointment);

export default groupRoute;
