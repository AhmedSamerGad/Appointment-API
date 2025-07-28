import Group from '../models/groupModel.js';
export async function processGroupsAndAttendance(reqUser, groupIdsFromBody, attendanceFromBody) {
  let attendance = [];
  let groupIds = [];

  if (groupIdsFromBody && Array.isArray(groupIdsFromBody)) {
    for (const groupId of groupIdsFromBody) {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      if (
        reqUser.role !== "admin" &&
        group.admin.toString() !== reqUser.id &&
        reqUser.role !== "super-admin"
      ) {
        throw new Error("Only group admins or super admins can use this group");
      }

      attendance.push(...group.members.map((member) => member._id.toString()));
      groupIds.push(group._id.toString());
    }
  } else {
    attendance = attendanceFromBody ? attendanceFromBody.map(String) : [];
  }

  // Always include creator in attendance
  if (!attendance.includes(reqUser.id)) {
    attendance.push(reqUser.id);
  }

  // Remove duplicates
  attendance = [...new Set(attendance)];

  return { attendance, groupIds };
}

export function buildInitialRating({ ratingInput, acceptedBy, comment, userId }) {
  return {
    ratedBy: userId,
    hasRated: false,
    ratedAt: Date.now(),
    users: acceptedBy.map((userId) => ({  
      ratedUser: userId,
      cumulativeRatingPoints: 0,
      comment: comment || "",
      reviews: ratingInput.map((review) => ({
        title: review.title,
        points: review.points || 0,
      })),
    })),
  };
}

export const calculateComputedStatus = (appointment) => {
  const getCairoDate = (dateStr) =>
    new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));

  const now = getCairoDate(new Date());
  const isOneDay = !appointment.endingdate || appointment.endingdate === appointment.startingdate;

  const startTime = appointment.startingtime || "00:00";
  const endTime = appointment.endingtime || "23:59";

  const start = getCairoDate(`${appointment.startingdate}T${startTime}`);
  const end = isOneDay
    ? getCairoDate(`${appointment.startingdate}T${endTime}`)
    : getCairoDate(`${appointment.endingdate}T${endTime}`);

  console.log("Start:", start);
  console.log("Start (ISO):", start.toLocaleTimeString({ timeZone: "Africa/Cairo" }));
  console.log("End:", end);
  console.log("End (ISO):", end.toLocaleTimeString({ timeZone: "Africa/Cairo" }));
  console.log("Now:", now);
  console.log("Now (ISO):", now.toLocaleTimeString({ timeZone: "Africa/Cairo" }));

  if (
    isNaN(start.getTime()) ||
    isNaN(end.getTime()) ||
    appointment.status === "rejected" ||
    appointment.status === "completed"
  )
    return appointment.status;

  if (now < start) return "inactive";
  if (now >= start && now <= end) return "active";
  if (now > end) return "expired";

  return appointment.status;
};
