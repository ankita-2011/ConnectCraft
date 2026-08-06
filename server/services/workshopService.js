import WorkshopRegistration from '../models/WorkshopRegistration.js';
import ProjectMember from '../models/ProjectMember.js';

/**
 * Enriches array of workshops with registered counts, user registration boolean, and host status boolean.
 */
export const enrichWorkshopsWithUserFlags = async (workshops, userId = null) => {
  if (!workshops || workshops.length === 0) return [];

  const workshopIds = workshops.map((w) => w._id);

  // Aggregation for counts per workshop
  const registrationCounts = await WorkshopRegistration.aggregate([
    { $match: { workshop: { $in: workshopIds } } },
    { $group: { _id: '$workshop', count: { $sum: 1 } } },
  ]);

  const countsMap = {};
  registrationCounts.forEach((rc) => {
    countsMap[rc._id.toString()] = rc.count;
  });

  // Check user registrations if logged in
  let userRegisteredSet = new Set();
  if (userId) {
    const userRegistrations = await WorkshopRegistration.find({
      workshop: { $in: workshopIds },
      user: userId,
    });
    userRegistrations.forEach((r) => {
      userRegisteredSet.add(r.workshop.toString());
    });
  }

  return workshops.map((w) => {
    const wObj = w.toObject ? w.toObject() : { ...w };
    const wIdStr = wObj._id.toString();

    wObj.registeredCount = countsMap[wIdStr] || 0;
    wObj.availableSeats = Math.max(0, (wObj.maxParticipants || 50) - wObj.registeredCount);
    wObj.isRegistered = userRegisteredSet.has(wIdStr);
    wObj.isHost = userId ? (wObj.host?._id || wObj.host).toString() === userId.toString() : false;

    // Mask meeting link unless user is host or registered
    if (!wObj.isHost && !wObj.isRegistered) {
      delete wObj.meetingLink;
    }

    return wObj;
  });
};

/**
 * Checks if user is eligible to register for a specific workshop.
 */
export const canUserRegisterForWorkshop = async (workshop, userId) => {
  if (!workshop || !userId) {
    return { valid: false, message: 'Invalid workshop or user ID.' };
  }

  if (workshop.host.toString() === userId.toString()) {
    return { valid: false, message: 'You are the host of this workshop.' };
  }

  if (workshop.status === 'Cancelled') {
    return { valid: false, message: 'This workshop has been cancelled.' };
  }

  if (workshop.status === 'Completed') {
    return { valid: false, message: 'This workshop has already completed.' };
  }

  // Check if project restricted meeting
  if (workshop.project) {
    const isMember = await ProjectMember.findOne({
      project: workshop.project,
      user: userId,
    });
    if (!isMember) {
      return { valid: false, message: 'Only project team members can register for project meetings.' };
    }
  }

  // Check duplicate registration
  const existing = await WorkshopRegistration.findOne({
    workshop: workshop._id,
    user: userId,
  });
  if (existing) {
    return { valid: false, message: 'You are already registered for this workshop.' };
  }

  // Check capacity
  const currentCount = await WorkshopRegistration.countDocuments({ workshop: workshop._id });
  if (currentCount >= workshop.maxParticipants) {
    return { valid: false, message: 'This workshop has reached maximum capacity.' };
  }

  return { valid: true };
};
