const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Position = require('../models/Position');

const getOverviewStats = async (req, res, next) => {
    try {
        const [
            totalEmployees,
            activeEmployees,
            probationEmployees,
            resignedEmployees,
            totalDepartments,
            totalPositions,
        ] = await Promise.all([
            Employee.countDocuments(),
            Employee.countDocuments({ status: 'active' }),
            Employee.countDocuments({ status: 'probation' }),
            Employee.countDocuments({ status: 'resigned' }),
            Department.countDocuments({ status: { $ne: 'inactive' } }),
            Position.countDocuments({ status: { $ne: 'inactive' } }),
        ]);

        res.status(200).json({
            message: 'Lấy thống kê tổng quan thành công',
            data: {
                totalEmployees,
                activeEmployees,
                probationEmployees,
                resignedEmployees,
                totalDepartments,
                totalPositions,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getDepartmentStats = async (req, res, next) => {
    try {
        const departments = await Department.find({ status: { $ne: 'inactive' } }).select('name code');
        const deptIds = departments.map((d) => d._id);

        const employeeCounts = await Employee.aggregate([
            { $match: { departmentId: { $in: deptIds }, status: { $ne: 'resigned' } } },
            { $group: { _id: '$departmentId', count: { $sum: 1 } } },
        ]);

        const countMap = {};
        employeeCounts.forEach((c) => {
            countMap[c._id.toString()] = c.count;
        });

        const data = departments.map((d) => ({
            departmentId: d._id,
            name: d.name,
            code: d.code,
            totalEmployees: countMap[d._id.toString()] || 0,
        }));

        res.status(200).json({
            message: 'Lấy thống kê nhân viên theo phòng ban thành công',
            data,
        });
    } catch (error) {
        next(error);
    }
};

const getPositionStats = async (req, res, next) => {
    try {
        const positions = await Position.find({ status: { $ne: 'inactive' } }).select('name code baseSalary');
        const posIds = positions.map((p) => p._id);

        const employeeCounts = await Employee.aggregate([
            { $match: { positionId: { $in: posIds }, status: { $ne: 'resigned' } } },
            { $group: { _id: '$positionId', count: { $sum: 1 } } },
        ]);

        const countMap = {};
        employeeCounts.forEach((c) => {
            countMap[c._id.toString()] = c.count;
        });

        const data = positions.map((p) => ({
            positionId: p._id,
            name: p.name,
            code: p.code,
            baseSalary: p.baseSalary,
            totalEmployees: countMap[p._id.toString()] || 0,
        }));

        res.status(200).json({
            message: 'Lấy thống kê nhân viên theo chức vụ thành công',
            data,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverviewStats,
    getDepartmentStats,
    getPositionStats,
};
