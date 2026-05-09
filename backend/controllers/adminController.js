import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

export const getTeamAttendance = async (req, res, next) => {
  try {
    let query;
    
    if (req.user.role === 'admin') {
      query = {};
    } else if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user._id }).select('_id');
      
      const teamIds = teamMembers.map(member => member._id);
      query = { userId: { $in: teamIds } };
    } else {
      res.status(403);
      throw new Error('Not authorized to view team records');
    }

    const records = await Attendance.find(query)
      .populate('userId', 'name email role')
      .sort({ date: -1, 'punchIn.time': -1 });

    res.json(records);
  } catch (error) {
    next(error);
  }
};

export const validateAttendance = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    
    if (!['valid', 'invalid'].includes(status)) {
      res.status(400);
      throw new Error('Status must be valid or invalid');
    }

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      res.status(404);
      throw new Error('Attendance record not found');
    }

    if (req.user.role === 'manager') {
      const employee = await User.findById(attendance.userId);
      if (employee.managerId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to validate this employee');
      }
    }

    attendance.validation = {
      status,
      remarks: remarks || '',
      verifiedBy: req.user._id,
    };

    const updatedAttendance = await attendance.save();

    res.json(updatedAttendance);
  } catch (error) {
    next(error);
  }
};


export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').populate('managerId', 'name email role');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!['employee', 'manager', 'admin'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role');
    }

    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot change your own role');
    }

    if (role === 'manager' || role === 'admin') {
      user.managerId = null;
    }

    user.role = role;
    const updatedUser = await user.save();
    
    const populatedUser = await User.findById(updatedUser._id).select('-password').populate('managerId', 'name email role');
    res.json(populatedUser);
  } catch (error) {
    next(error);
  }
};


export const assignManager = async (req, res, next) => {
  try {
    const { managerId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'manager' || user.role === 'admin') {
      if (managerId !== null) {
        res.status(400);
        throw new Error(`${user.role.charAt(0).toUpperCase() + user.role.slice(1)}s cannot be assigned under a manager`);
      }
    }

    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        res.status(404);
        throw new Error('Target manager not found');
      }
      if (manager.role !== 'manager') {
        res.status(400);
        throw new Error('Assigned user is not a manager');
      }
      if (manager._id.toString() === user._id.toString()) {
        res.status(400);
        throw new Error('Cannot assign user to themselves');
      }
    }

    user.managerId = managerId || null;
    const updatedUser = await user.save();
    
    const populatedUser = await User.findById(updatedUser._id).select('-password').populate('managerId', 'name email role');
    res.json(populatedUser);
  } catch (error) {
    next(error);
  }
};
