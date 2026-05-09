import Overtime from '../models/Overtime.js';
import User from '../models/User.js';


export const requestOvertime = async (req, res, next) => {
  try {
    const { attendanceId, hoursRequested, reason } = req.body;

    const existingRequest = await Overtime.findOne({ attendanceId });
    if (existingRequest) {
      res.status(400);
      throw new Error('Overtime request already submitted for this attendance record');
    }

    const overtime = await Overtime.create({
      attendanceId,
      userId: req.user._id,
      hoursRequested,
      reason,
    });

    res.status(201).json(overtime);
  } catch (error) {
    next(error);
  }
};


export const getMyOvertimeRequests = async (req, res, next) => {
  try {
    const requests = await Overtime.find({ userId: req.user._id })
      .populate('attendanceId', 'date workingHours')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const getTeamOvertimeRequests = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = {};
    } else if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user._id }).select('_id');
      const teamIds = teamMembers.map(m => m._id);
      query = { userId: { $in: teamIds } };
    } else {
      res.status(403);
      throw new Error('Not authorized to view team overtime requests');
    }

    const requests = await Overtime.find(query)
      .populate('userId', 'name email')
      .populate('attendanceId', 'date workingHours')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    next(error);
  }
};


export const reviewOvertime = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400);
      throw new Error('Status must be approved or rejected');
    }

    const overtime = await Overtime.findById(req.params.id);

    if (!overtime) {
      res.status(404);
      throw new Error('Overtime request not found');
    }

    if (req.user.role === 'manager') {
      const employee = await User.findById(overtime.userId);
      if (employee.managerId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to review this employee');
      }
    }

    overtime.status = status;
    overtime.reviewedBy = req.user._id;
    const updatedOvertime = await overtime.save();

    res.json(updatedOvertime);
  } catch (error) {
    next(error);
  }
};
