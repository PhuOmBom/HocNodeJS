const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Position = require('../models/Position');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

const getDashboardStats = async (req, res, next) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [
            totalEmployees,
            activeEmployees,
            probationEmployees,
            resignedEmployees,
            totalDepartments,
            totalPositions,
            todayAttendances,
            pendingLeaves,
            recentEmployees,
            recentLeaves,
        ] = await Promise.all([
            Employee.countDocuments(),
            Employee.countDocuments({ status: 'active' }),
            Employee.countDocuments({ status: 'probation' }),
            Employee.countDocuments({ status: 'resigned' }),
            Department.countDocuments({ status: 'active' }),
            Position.countDocuments({ status: 'active' }),
            Attendance.find({ date: { $gte: todayStart, $lte: todayEnd } }),
            Leave.countDocuments({ status: 'pending' }),
            Employee.find().populate('departmentId', 'name code').populate('positionId', 'name').sort({ createdAt: -1 }).limit(5),
            Leave.find().populate('employeeId', 'fullName employeeCode').sort({ createdAt: -1 }).limit(5),
        ]);

        const presentToday = todayAttendances.filter((a) => a.status === 'present').length;
        const lateToday = todayAttendances.filter((a) => a.status === 'late').length;
        const onLeaveToday = todayAttendances.filter((a) => a.status === 'leave').length;

        res.status(200).json({
            success: true,
            summary: {
                employees: {
                    total: totalEmployees,
                    active: activeEmployees,
                    probation: probationEmployees,
                    resigned: resignedEmployees,
                },
                departments: totalDepartments,
                positions: totalPositions,
                attendanceToday: {
                    totalCheckedIn: presentToday + lateToday,
                    present: presentToday,
                    late: lateToday,
                    onLeave: onLeaveToday,
                },
                pendingLeaveRequests: pendingLeaves,
            },
            recentEmployees,
            recentLeaves,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
};
