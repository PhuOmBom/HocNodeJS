require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Position = require('../models/Position');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const connectDatabase = require('../config/db');

async function seedData() {
    try {
        await connectDatabase();
        console.log('--- Bắt đầu khởi tạo dữ liệu mẫu (Seed Data) ---');

        await Promise.all([
            User.deleteMany({}),
            Department.deleteMany({}),
            Position.deleteMany({}),
            Employee.deleteMany({}),
            Attendance.deleteMany({}),
            Leave.deleteMany({}),
        ]);
        console.log('✓ Đã dọn dẹp dữ liệu cũ thành công.');

        const users = await User.create([
            {
                fullName: 'Quản trị viên Hệ thống (Admin)',
                email: 'admin@hr.com',
                password: 'password123',
                role: 'admin',
                status: 'active',
            },
            {
                fullName: 'Trưởng phòng Nhân sự (HR)',
                email: 'hr@hr.com',
                password: 'password123',
                role: 'hr',
                status: 'active',
            },
            {
                fullName: 'Nhân viên Kỹ thuật (Staff)',
                email: 'staff@hr.com',
                password: 'password123',
                role: 'staff',
                status: 'active',
            },
        ]);
        console.log(`✓ Đã tạo ${users.length} tài khoản người dùng (Admin, HR, Staff). Mật khẩu: password123`);

        const departments = await Department.create([
            {
                name: 'Phòng Công nghệ Thông tin',
                code: 'IT',
                description: 'Nghiên cứu, phát triển hệ thống và hạ tầng kỹ thuật phần mềm.',
                status: 'active',
            },
            {
                name: 'Phòng Quản trị Nhân sự',
                code: 'HR',
                description: 'Tuyển dụng, đào tạo, quản lý chế độ và chính sách nhân sự.',
                status: 'active',
            },
            {
                name: 'Phòng Kinh doanh & Tiếp thị',
                code: 'SALE',
                description: 'Mở rộng thị trường, chăm sóc khách hàng và phát triển doanh thu.',
                status: 'active',
            },
            {
                name: 'Phòng Tài chính - Kế toán',
                code: 'ACC',
                description: 'Quản lý dòng tiền, báo cáo thuế và thanh toán tiền lương.',
                status: 'active',
            },
        ]);
        console.log(`✓ Đã tạo ${departments.length} phòng ban.`);

        const positions = await Position.create([
            {
                name: 'Giám đốc Kỹ thuật (CTO)',
                code: 'CTO',
                description: 'Định hướng kiến trúc và chiến lược công nghệ toàn công ty.',
                baseSalary: 45000000,
                status: 'active',
            },
            {
                name: 'Kỹ sư Phần mềm Cao cấp (Senior Dev)',
                code: 'DEV_SR',
                description: 'Xây dựng core modules và tối ưu hóa hệ thống backend.',
                baseSalary: 30000000,
                status: 'active',
            },
            {
                name: 'Chuyên viên Nhân sự (HR Specialist)',
                code: 'HR_SPEC',
                description: 'Phụ trách chấm công, bảo hiểm và văn hóa doanh nghiệp.',
                baseSalary: 18000000,
                status: 'active',
            },
            {
                name: 'Chuyên viên Kinh doanh (Sales Rep)',
                code: 'SALES',
                description: 'Tìm kiếm khách hàng doanh nghiệp và chốt hợp đồng dịch vụ.',
                baseSalary: 15000000,
                status: 'active',
            },
            {
                name: 'Thực tập sinh Lập trình (Intern)',
                code: 'INTERN',
                description: 'Hỗ trợ phát triển tính năng và kiểm thử phần mềm.',
                baseSalary: 6000000,
                status: 'active',
            },
        ]);
        console.log(`✓ Đã tạo ${positions.length} chức vụ.`);

        const itDept = departments.find((d) => d.code === 'IT');
        const hrDept = departments.find((d) => d.code === 'HR');
        const saleDept = departments.find((d) => d.code === 'SALE');

        const ctoPos = positions.find((p) => p.code === 'CTO');
        const devPos = positions.find((p) => p.code === 'DEV_SR');
        const hrPos = positions.find((p) => p.code === 'HR_SPEC');
        const salesPos = positions.find((p) => p.code === 'SALES');

        const emp1 = await Employee.create({
            employeeCode: 'EMP001',
            fullName: 'Nguyễn Văn An',
            email: 'admin@hr.com',
            phone: '0901234567',
            gender: 'male',
            dateOfBirth: new Date('1990-05-15'),
            address: '72 Lê Thánh Tôn, Quận 1, TP.HCM',
            departmentId: itDept._id,
            positionId: ctoPos._id,
            salary: 45000000,
            status: 'active',
        });

        const emp2 = await Employee.create({
            employeeCode: 'EMP002',
            fullName: 'Trần Thị Bích',
            email: 'hr@hr.com',
            phone: '0912345678',
            gender: 'female',
            dateOfBirth: new Date('1994-08-20'),
            address: '124 Hoàng Văn Thụ, Phú Nhuận, TP.HCM',
            departmentId: hrDept._id,
            positionId: hrPos._id,
            salary: 18000000,
            managerId: emp1._id,
            status: 'active',
        });

        const emp3 = await Employee.create({
            employeeCode: 'EMP003',
            fullName: 'Lê Hoàng Cường',
            email: 'staff@hr.com',
            phone: '0923456789',
            gender: 'male',
            dateOfBirth: new Date('1998-11-10'),
            address: '45 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
            departmentId: itDept._id,
            positionId: devPos._id,
            salary: 30000000,
            managerId: emp1._id,
            status: 'active',
        });

        const emp4 = await Employee.create({
            employeeCode: 'EMP004',
            fullName: 'Phạm Thu Dung',
            email: 'dung.pham@hr.com',
            phone: '0934567890',
            gender: 'female',
            dateOfBirth: new Date('2001-03-25'),
            address: '88 Cầu Giấy, Hà Nội',
            departmentId: saleDept._id,
            positionId: salesPos._id,
            salary: 15000000,
            managerId: emp2._id,
            status: 'probation',
        });

        console.log('✓ Đã tạo 4 hồ sơ nhân sự mẫu liên kết chức vụ & phòng ban.');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkIn1 = new Date();
        checkIn1.setHours(8, 15, 0, 0);
        const checkOut1 = new Date();
        checkOut1.setHours(17, 30, 0, 0);

        const checkIn2 = new Date();
        checkIn2.setHours(8, 25, 0, 0);

        const checkIn3 = new Date();
        checkIn3.setHours(9, 10, 0, 0);

        await Attendance.create([
            {
                employeeId: emp1._id,
                date: today,
                checkIn: checkIn1,
                checkOut: checkOut1,
                workingHours: 8.5,
                status: 'present',
            },
            {
                employeeId: emp2._id,
                date: today,
                checkIn: checkIn2,
                status: 'present',
            },
            {
                employeeId: emp3._id,
                date: today,
                checkIn: checkIn3,
                status: 'late',
            },
        ]);
        console.log('✓ Đã tạo 3 bản ghi điểm danh mẫu hôm nay (2 đúng giờ, 1 đi muộn).');

        const nextWeekStart = new Date();
        nextWeekStart.setDate(nextWeekStart.getDate() + 3);
        const nextWeekEnd = new Date();
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 5);

        await Leave.create([
            {
                employeeId: emp4._id,
                leaveType: 'annual',
                startDate: nextWeekStart,
                endDate: nextWeekEnd,
                reason: 'Về quê có việc gia đình và đi khám sức khỏe định kỳ.',
                status: 'pending',
            },
        ]);
        console.log('✓ Đã tạo đơn xin nghỉ phép mẫu trạng thái "pending".');

        console.log('\n=== TỔNG KẾT KHỞI TẠO DỮ LIỆU ===');
        console.log('• Admin Account : admin@hr.com / password123');
        console.log('• HR Account    : hr@hr.com / password123');
        console.log('• Staff Account : staff@hr.com / password123');
        console.log('=================================');
    } catch (error) {
        console.error('Lỗi khi seed data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✓ Đã ngắt kết nối cơ sở dữ liệu an toàn.');
    }
}

seedData();
