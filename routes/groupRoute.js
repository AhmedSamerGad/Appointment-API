import express from "express";
import * as groupAdmin from '../controllers/groupsControllers/groupAdmin.js';
import * as groupCRUD from '../controllers/groupsControllers/groupCRUD.js';
import * as groupUsers from '../controllers/groupsControllers/groupUsers.js';
import * as groupPosts from '../controllers/groupsControllers/groupsPosts.js';
import {
  createGroupValidator,
  updateAdminGroupValidator,
  updatedGroupValidator,
  removeGroupUserValidator,
  addGroupUserValidator,
} from "../utils/validators/groupValidator.js";
import verifyToken from "../middlewares/verifyToken.js";
import allowedTo from "../middlewares/allowedTo.js";

const groupRoute = express.Router();
groupRoute.use(verifyToken);
// operations related to group creation and fetching user groups
groupRoute
  .route("/")
  .post(
    allowedTo("super-admin"),
    createGroupValidator,
    groupCRUD.createGroup
  )
  .get(groupCRUD.getUserGroups);
// operations related to group
groupRoute
  .route("/:id")
  .patch(
    allowedTo("super-admin", "admin"),
    updatedGroupValidator,
    groupCRUD.updateGroup
  )
  .get(groupCRUD.getUserGroups)
  .delete(allowedTo("super-admin"), groupCRUD.deleteGroup);
// operations related to group admin
groupRoute
  .route("/:id/admin")
  .patch(
    allowedTo("super-admin"),
    updateAdminGroupValidator,
    groupAdmin.updateAdminGroup
  )
  .get(groupAdmin.getGroupAdmin)
  .get(allowedTo("super-admin"), groupAdmin.getAdminForGroups);
// operations related to group users
groupRoute
  .route("/:id/users")
  .get(groupUsers.getGroupUsers)
  .post(
    allowedTo("admin", "super-admin"),
    addGroupUserValidator,
    groupUsers.addGroupUser
  )
  .delete(
    allowedTo("admin", "super-admin"),
    removeGroupUserValidator,
    groupUsers.deleteGroupUser
  );
// post for the group id , get for the group id ,delete for the group id
// operations related to group posts ( i want to replace this with appointment feature)
groupRoute
  .route("/:id/appointment")
.get(groupPosts.getGroupPosts)
  .delete(allowedTo("admin", "super-admin"), groupPosts.deleteGroupPost);


groupRoute.post("/:appointmentId/accept", groupPosts.acceptAppointment);

export default groupRoute;
