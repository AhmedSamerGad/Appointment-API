    import Group from '../models/groupModel.js';
    import Appointment from '../models/appointmentModel.js';
    import User from '../models/userModel.js';
    import errorHandler from '../middlewares/errorHandler.js';
    import ApiResponse from '../utils/apiResponse.js';

    export const createGroup = errorHandler(async (req, res, next) => {
    const group = (await Group.create({...req.body})).populate('admin','name email');
    if(!group){
        const error = res.status(400).json(new ApiResponse('fail', 'Group not created'));
        return next(error);
    }
    res.status(201).json(new ApiResponse('success','Group created successfuly', group));
    });

    export const getUserGroups = errorHandler(async (req, res, next) => {
    const userId = req.user.id; // Get user ID from authenticated user

    const groups = await Group.find({
        $or: [
            { members: userId },  // User is a member
            { admin: userId }     // User is an admin
        ]
    })
    .populate('admin', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });

    if (!groups || groups.length === 0) {
        return res.status(404).json(
            new ApiResponse('fail', 'No groups found for this user')
        );
    }

    res.status(200).json(
        new ApiResponse(
            'success', 
            'Groups retrieved successfully', 
            groups
        )
    );
    });

    export const updateGroup = errorHandler(async (req, res, next) => {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body,{new : true});
    if(!group){
        const error = res.status(404).json(new ApiResponse('fail', 'Group not found'));
        return next(error);
    }
    res.status(200).json(new ApiResponse('success','', group));
    });

    export const deleteGroup = errorHandler(async (req, res, next) => { 
    const group = await Group.findByIdAndDelete(req.params.id);
    if(!group){
        const error = res.status(404).json(new ApiResponse('fail', 'Group not found'));
        return next(error);
    }
    res.status(204).json(new ApiResponse('success','', null));
    });

    export const getGroupAdmin = errorHandler(async (req, res, next) => {
    const group = await Group.findById(req.params.id);
    if(!group){
        const error = res.status(404).json(new ApiResponse('fail', 'Group not found'));
        return next(error);
    }
    res.status(200).json(new ApiResponse('success', group.admin));
    });
    // i want to check the admin is in the group 
    export const updateAdminGroup = errorHandler(async (req, res, next) => {
        try {
            // Step 1: Validate request body
            if (!req.body.admin) {
                return res.status(400).json(
                    new ApiResponse('fail', 'New admin ID is required', null)
                );
            }
    
            // Step 2: Find group and check if exists
            const group = await Group.findById(req.params.id)
                .populate('admin', 'name email role')
                .populate('members', 'name email');
    
            if (!group) {
                return res.status(404).json(
                    new ApiResponse('fail', 'Group not found', null)
                );
            }
    
            // Step 3: Check permissions
            if (req.user.role !== 'super-admin' && 
                group.admin._id.toString() !== req.user.id) {
                return res.status(403).json(
                    new ApiResponse('fail', 'Only super-admin or current group admin can update admin', null)
                );
            }
    
            // Step 4: Store old admin ID for later use
            const oldAdminId = group.admin._id;
    
            // Step 5: Check if new admin is a member
            if (!group.members.some(member => member._id.toString() === req.body.admin)) {
                return res.status(400).json(
                    new ApiResponse('fail', 'New admin must be a member of the group', null)
                );
            }
    
            // Step 6: Check if new admin exists
            const newAdmin = await User.findById(req.body.admin);
            if (!newAdmin) {
                return res.status(404).json(
                    new ApiResponse('fail', 'New admin user not found', null)
                );
            }
    
            // Step 7: Update group's admin
            group.admin = req.body.admin;
            await group.save();
    
            // Step 8: Update new admin's role and group
            await User.findByIdAndUpdate(
                req.body.admin,
                { 
                    role: 'admin',
                    $addToSet: { groups: req.params.id }
                },
                { new: true }
            );
    
            // Step 9: Check if old admin is admin in other groups
            const otherGroupsWithOldAdmin = await Group.findOne({
                _id: { $ne: req.params.id },
                admin: oldAdminId
            });
    
            // Step 10: If old admin has no other groups, change role to user
            if (!otherGroupsWithOldAdmin) {
                await User.findByIdAndUpdate(
                    oldAdminId,
                    { 
                        role: 'user',
                        $unset: { group: "" }
                    }
                );
            }
    
            // Step 11: Get updated group with populated fields
            const updatedGroup = await Group.findById(group._id)
                .populate('admin', 'name email role groups')
                .populate('members', 'name email');
    
            return res.status(200).json(
                new ApiResponse('success', 'Admin updated successfully', updatedGroup)
            );
    
        } catch (error) {
            console.error('Update admin error:', error);
            return res.status(500).json(
                new ApiResponse('fail', 'Error updating group admin', error.message)
            );
        }
    });
    export const getGroupUsers = errorHandler(async (req, res, next) => {
    const group = await Group.findById(req.params.id);
    if(!group){
        const error = res.status(404).json(new ApiResponse('fail', 'Group not found'));
        return next(error);
    }
    res.status(200).json(new ApiResponse('success','', group.members));
    });
    export const addGroupUser = errorHandler(async (req, res, next) => {
    const { members } = req.body;
    const groupId = req.params.id;

    // Validate members array
    if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json(
            new ApiResponse('fail', 'Please provide an array of member IDs')
        );
    }

    // Find group and validate admin
    const group = await Group.findById(groupId);
    if (!group) {
        return res.status(404).json(
            new ApiResponse('fail', 'Group not found')
        );
    }

    try {
        if (req.user.role !== 'admin' && group.admin.toString() !== req.user.id && req.user.role !== 'super-admin') {
            return res.status(403).json(new ApiResponse('fail', 'Only group admins can add members or super admins'));
        }
        // Check for existing members
        const existingMembers = group.members.map(member => member.toString());
        const duplicateMembers = members.filter(member => 
            existingMembers.includes(member)
        );

        if (duplicateMembers.length > 0) {
            return res.status(400).json(
                new ApiResponse('fail', 
                    'Some users are already members of the group',
                    { duplicateMembers }
                )
            );
        }

        // Add new members
        group.members.push(...members);
        await group.save();

        await User.updateMany(
            { _id: { $in: members } },
            { $addToSet: { groups: groupId } }
        );

        // Populate member details in response
        const updatedGroup = await Group.findById(groupId)
            .populate('members', 'name email')
            .populate('admin', 'name email');

        return res.status(200).json(
            new ApiResponse('success', 
                'Users added to group successfully', 
                updatedGroup
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiResponse('error', 'Error adding members to group')
        );
    }
    });
    export const deleteGroupUser = errorHandler(async (req, res, next) => {
    const { members } = req.body;
    const groupId = req.params.id;

    // Validate members array
    if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json(
            new ApiResponse('fail', 'Please provide an array of member IDs')
        );
    }

    // Find group
    const group = await Group.findById(groupId);
    if (!group) {
        return res.status(404).json(
            new ApiResponse('fail', 'Group not found')
        );
    }
    if (req.user.role !== 'admin' || group.admin.toString() !== req.user.id || req.user.role !== 'super-admin') {
        return res.status(403).json(new ApiResponse('fail', 'Only group admins can add members or super admins'));
    }
    // Remove specified members from group
    const updatedMembers = group.members.filter(member => !members.includes(member.toString()));
    if (updatedMembers.length === group.members.length) {
        return res.status(400).json(
            new ApiResponse('fail', 'No specified members were removed')
        );
    }

    group.members = updatedMembers;
    await group.save();
    await User.updateMany(
        { _id: { $in: members } },
        { $pull: { groups: groupId } }
    );

    // Populate member details in response
    const updatedGroup = await Group.findById(groupId).populate('admin', 'name email')
        .populate('members', 'name email');
        

    res.status(200).json(
        new ApiResponse('success', 'Specified members removed from group', updatedGroup)
    );
    });
    
    export const getGroupPosts = errorHandler(async (req, res, next) => {
    const group = await Group.findById(req.params.id).populate('Appointments').select('startingdate ');
    if(!group){
        const error = res.status(404).json(new ApiResponse('fail', 'Group not found'));
        return next(error);
    }
    res.status(200).json(new ApiResponse('success','', group.Appointments));
    });
    export const addGroupPost = errorHandler(async (req, res, next) => {
    try {
        const appointmentData = req.body.Appointment;
        if (req.user.role !== 'admin' && req.user.role !== 'super-admin' && group.admin.toString() !== req.user.id) {
            return res.status(403).json(new ApiResponse('fail', 'Only group admins or super admins can add appointments',[]));
        }
        
        // Validate appointment data
        if (!appointmentData || !appointmentData.title || !appointmentData.user || !appointmentData.startingdate) {
            return res.status(400).json(
                new ApiResponse('fail', 'Title, user ID and starting date are required')
            );
        }

        // Create new appointment document
        const appointment = await Appointment.create({
            title: appointmentData.title,
            user: appointmentData.user,
            startingdate: appointmentData.startingdate,
            status: 'pending',
            attendance: appointmentData.attendance || [],
            ...req.body
        });

        // Add all group members to the appointment's attendance
        const group = await Group.findById(req.params.id).populate('members', '_id');
        if (group) {
            group.Appointments.push(appointment._id);
            await group.save();
            appointment.attendance = group.members.map(member => member._id);
            await appointment.save();
        }else {
            // Delete the created appointment if group not found
            await Appointment.findByIdAndDelete(appointment._id);
            return res.status(404).json(
                new ApiResponse('fail', 'Group not found')
            );
        }


        res.status(200).json(
            new ApiResponse(
                'success',
                'Appointment added successfully',
                appointment
            )
        );

    } catch (error) {
        console.error('Add appointment error:', error);
        return res.status(400).json(
            next( new ApiResponse('fail', 'Error adding appointment', error.message))
        );
    }
    });



    export const deleteGroupPost = errorHandler(async (req, res, next) => {

    const appointment = req.body.appointment;   //appointment id
    if (req.user.role !== 'admin' || group.admin.toString() !== req.user.id || req.user.role !== 'super-admin') {
        return res.status(403).json(new ApiResponse('fail', 'Only group admins can add members or super admins'));
    }
    const group = await Group.findByIdAndUpdate(req.params.id, { $pull: { Appointments: appointment } }, { new: true }); 
    if(!group){
        const error = res.status(404).json(new ApiResponse('fail', 'Group not found'));
        return next(error);
    }
    res.status(200).json(new ApiResponse('success', group.Appointments));  
    });


    export const acceptAppointment = errorHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json(
                new ApiResponse('fail', 'Appointment not found')
            );
        }

        // Check if user already accepted
        if (appointment.acceptedBy.includes(userId)) {
            return res.status(400).json(
                new ApiResponse('fail', 'You have already accepted this appointment')
            );
        }

        // Add user to acceptedBy array correctly
        appointment.acceptedBy.push(userId );
        await appointment.save();

        // Add appointment to user's appointments using atomic operation
        await User.findByIdAndUpdate(
            userId,
            { $addToSet: { appointments: appointmentId } },
            { new: true }
        );

        // Get updated appointment with populated data
        const updatedAppointment = await Appointment.findById(appointmentId)
            .populate('acceptedBy.user', 'name email')
            .populate('user', 'name email');

        return res.status(200).json(
            new ApiResponse('success', 'Appointment accepted successfully', updatedAppointment)
        );

    } catch (error) {
        console.error('Accept appointment error:', error);
        return res.status(400).json(
            new ApiResponse('fail', 'Error accepting appointment', error.message)
        );
    }
});