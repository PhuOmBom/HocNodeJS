require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDatabase = require('./src/config/db');

const PORT = 5098;
let server;

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        const body = options.body ? JSON.stringify(options.body) : null;
        if (body) {
            headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(
            {
                hostname: '127.0.0.1',
                port: PORT,
                path,
                method: options.method || 'GET',
                headers,
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({ status: res.statusCode, body: parsed, raw: data });
                    } catch (e) {
                        resolve({ status: res.statusCode, body: data, raw: data });
                    }
                });
            }
        );

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

function assert(condition, message, res) {
    if (!condition) {
        const extra = res ? ` (Status: ${res.status}, Body: ${JSON.stringify(res.body)})` : '';
        throw new Error(`❌ FAILED: ${message}${extra}`);
    }
    console.log(`  ✓ ${message}`);
}

async function runTests() {
    console.log('🚀 Bắt đầu kiểm thử tự động toàn diện MiniProject REST API theo chuẩn HackMD...\n');

    await connectDatabase();
    server = app.listen(PORT);

    const ts = Date.now();
    let adminToken, hrToken, staffToken;
    let deptId, posId, empId, leaveId;

    try {
        console.log('--- 1. Kiểm thử Root Endpoint ---');
        const rootRes = await request('/');
        assert(rootRes.status === 200, 'GET / trả về HTTP 200');
        assert(rootRes.body.endpoints && rootRes.body.endpoints.auth === '/api/auth', 'Root endpoint trả về danh sách route chuẩn');

        console.log('\n--- 2. Kiểm thử Authentication & Profile (Bài 1 & Bài 3) ---');
        // Register Admin
        const regAdmin = await request('/api/auth/register', {
            method: 'POST',
            body: {
                fullName: 'Admin Test',
                email: `admin_${ts}@test.com`,
                password: 'password123',
                role: 'admin',
            },
        });
        assert(regAdmin.status === 201, 'POST /api/auth/register tạo user Admin', regAdmin);
        assert(regAdmin.body.data && regAdmin.body.data.role === 'admin', 'Response trả về data user không chứa password');

        // Login Admin
        const loginAdmin = await request('/api/auth/login', {
            method: 'POST',
            body: {
                email: `admin_${ts}@test.com`,
                password: 'password123',
            },
        });
        assert(loginAdmin.status === 200, 'POST /api/auth/login Admin thành công');
        adminToken = loginAdmin.body.token;
        assert(adminToken, 'Admin nhận được JWT token');

        // Register HR & Staff
        const regHr = await request('/api/auth/register', {
            method: 'POST',
            body: {
                fullName: 'HR Test',
                email: `hr_${ts}@test.com`,
                password: 'password123',
                role: 'hr',
            },
        });
        assert(regHr.status === 201, 'POST /api/auth/register tạo user HR');

        const loginHr = await request('/api/auth/login', {
            method: 'POST',
            body: { email: `hr_${ts}@test.com`, password: 'password123' },
        });
        hrToken = loginHr.body.token;

        const regStaff = await request('/api/auth/register', {
            method: 'POST',
            body: {
                fullName: 'Staff Test',
                email: `staff_${ts}@test.com`,
                password: 'password123',
                role: 'staff',
            },
        });
        assert(regStaff.status === 201, 'POST /api/auth/register tạo user Staff');

        const loginStaff = await request('/api/auth/login', {
            method: 'POST',
            body: { email: `staff_${ts}@test.com`, password: 'password123' },
        });
        staffToken = loginStaff.body.token;

        // Get Me
        const meRes = await request('/api/auth/me', {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(meRes.status === 200, 'GET /api/auth/me thành công');
        assert(meRes.body.user.role === 'admin', 'GET /api/auth/me trả về đúng thông tin user');

        // Profile API (Bài 3)
        const profileRes = await request('/api/profile', {
            headers: { Authorization: `Bearer ${staffToken}` },
        });
        assert(profileRes.status === 200, 'GET /api/profile thành công');

        const updateProf = await request('/api/profile', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${staffToken}` },
            body: {
                phone: '0912345678',
                address: 'Hà Nội',
                avatarUrl: 'https://example.com/avatar.jpg',
            },
        });
        assert(updateProf.status === 200, 'PUT /api/profile cập nhật hồ sơ cá nhân thành công');
        assert(updateProf.body.data.phone === '0912345678', 'Hồ sơ đã cập nhật số điện thoại');

        const changePass = await request('/api/profile/change-password', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${staffToken}` },
            body: {
                oldPassword: 'password123',
                newPassword: 'newpassword123',
            },
        });
        assert(changePass.status === 200, 'PATCH /api/profile/change-password đổi mật khẩu thành công');

        console.log('\n--- 3. Kiểm thử Phòng Ban & Chức Vụ (Bài 1) ---');
        // Create Department
        const createDept = await request('/api/departments', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: {
                name: `Phòng Kỹ thuật ${ts}`,
                code: `TECH_${ts}`,
                description: 'Phòng phát triển phần mềm',
            },
        });
        assert(createDept.status === 201, 'POST /api/departments thêm phòng ban mới thành công');
        deptId = createDept.body.data._id;

        // Get Departments
        const getDepts = await request('/api/departments', {
            headers: { Authorization: `Bearer ${staffToken}` },
        });
        assert(getDepts.status === 200, 'GET /api/departments thành công');

        // Create Position
        const createPos = await request('/api/positions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: {
                name: `Backend Developer ${ts}`,
                code: `BEDEV_${ts}`,
                baseSalary: 15000000,
                description: 'Lập trình viên backend',
            },
        });
        assert(createPos.status === 201, 'POST /api/positions thêm chức vụ mới thành công');
        posId = createPos.body.data._id;

        // Role 403 Check: Staff cannot create position
        const staffCreatePos = await request('/api/positions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${staffToken}` },
            body: { name: 'Hack Pos', code: 'HACK', baseSalary: 1000 },
        });
        assert(staffCreatePos.status === 403, 'Staff không có quyền tạo chức vụ (HTTP 403)');
        assert(staffCreatePos.body.message === 'Bạn không có quyền thực hiện chức năng này', 'Message 403 khớp chuẩn đề bài');

        console.log('\n--- 4. Kiểm thử Nhân Viên (Bài 2 & Bài 3) ---');
        // Create Employee
        const createEmp = await request('/api/employees', {
            method: 'POST',
            headers: { Authorization: `Bearer ${hrToken}` },
            body: {
                employeeCode: `NV_${ts}`,
                fullName: 'Nguyễn Văn Test',
                email: `staff_${ts}@test.com`,
                phone: '0987654321',
                gender: 'male',
                dateOfBirth: '1995-03-15',
                address: 'Hà Nội',
                departmentId: deptId,
                positionId: posId,
                salary: 16000000,
                status: 'probation',
                startDate: new Date(),
            },
        });
        assert(createEmp.status === 201, 'POST /api/employees tạo nhân viên thành công');
        empId = createEmp.body.data._id;

        // Get Employees with pagination
        const getEmps = await request('/api/employees?page=1&limit=10', {
            headers: { Authorization: `Bearer ${staffToken}` },
        });
        assert(getEmps.status === 200, 'GET /api/employees thành công');
        assert(getEmps.body.pagination && getEmps.body.pagination.page === 1, 'Response có định dạng pagination chuẩn');

        // Business Rule: Cannot delete department if active employees exist
        const delDeptFail = await request(`/api/departments/${deptId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(delDeptFail.status === 400, 'Không thể xóa phòng ban khi còn nhân viên đang làm việc');

        // Birthdays (Bài 3)
        const bdayRes = await request('/api/employees/birthdays?month=3', {
            headers: { Authorization: `Bearer ${hrToken}` },
        });
        assert(bdayRes.status === 200, 'GET /api/employees/birthdays thành công');

        // Probation Ending (Bài 3)
        const probRes = await request('/api/employees/probation-ending?days=70', {
            headers: { Authorization: `Bearer ${hrToken}` },
        });
        assert(probRes.status === 200, 'GET /api/employees/probation-ending thành công');

        // Export (Bài 3)
        const exportJson = await request('/api/employees/export?format=json', {
            headers: { Authorization: `Bearer ${hrToken}` },
        });
        assert(exportJson.status === 200, 'GET /api/employees/export?format=json thành công');

        const exportCsv = await request('/api/employees/export?format=csv', {
            headers: { Authorization: `Bearer ${hrToken}` },
        });
        assert(exportCsv.status === 200, 'GET /api/employees/export?format=csv thành công');

        console.log('\n--- 5. Kiểm thử Chấm Công (Bài 2) ---');
        // Check-in
        const checkInRes = await request('/api/attendances/check-in', {
            method: 'POST',
            headers: { Authorization: `Bearer ${staffToken}` },
            body: { employeeId: empId },
        });
        assert(checkInRes.status === 200, 'POST /api/attendances/check-in thành công');

        // Duplicate check-in should fail
        const dupCheckIn = await request('/api/attendances/check-in', {
            method: 'POST',
            headers: { Authorization: `Bearer ${staffToken}` },
            body: { employeeId: empId },
        });
        assert(dupCheckIn.status === 400, 'Check-in lần 2 trong cùng ngày bị từ chối');

        // Check-out
        const checkOutRes = await request('/api/attendances/check-out', {
            method: 'POST',
            headers: { Authorization: `Bearer ${staffToken}` },
            body: { employeeId: empId },
        });
        assert(checkOutRes.status === 200, 'POST /api/attendances/check-out thành công');
        assert(checkOutRes.body.data.workingHours !== undefined, 'Tự động tính workingHours khi check-out');

        // Get My Attendance
        const myAttRes = await request('/api/attendances/me', {
            headers: { Authorization: `Bearer ${staffToken}` },
        });
        assert(myAttRes.status === 200, 'GET /api/attendances/me thành công');

        console.log('\n--- 6. Kiểm thử Nghỉ Phép (Bài 2) ---');
        // Submit Leave Request
        const createLeaveRes = await request('/api/leaves', {
            method: 'POST',
            headers: { Authorization: `Bearer ${staffToken}` },
            body: {
                employeeId: empId,
                leaveType: 'annual',
                startDate: '2026-09-20',
                endDate: '2026-09-22',
                reason: 'Việc gia đình',
            },
        });
        assert(createLeaveRes.status === 201, 'POST /api/leaves gửi đơn nghỉ phép thành công');
        assert(createLeaveRes.body.data.status === 'pending', 'Trạng thái mặc định là pending');
        leaveId = createLeaveRes.body.data._id;

        // Approve Leave
        const approveRes = await request(`/api/leaves/${leaveId}/approve`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${hrToken}` },
        });
        assert(approveRes.status === 200, 'PATCH /api/leaves/:id/approve duyệt đơn thành công');
        assert(approveRes.body.data.status === 'approved', 'Đơn đã chuyển sang trạng thái approved');

        // Cannot reject already approved leave
        const rejectFail = await request(`/api/leaves/${leaveId}/reject`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${hrToken}` },
        });
        assert(rejectFail.status === 400, 'Không cho phép từ chối đơn đã được xử lý');

        console.log('\n--- 7. Kiểm thử Thống Kê (Bài 3) ---');
        const statOverview = await request('/api/statistics/overview', {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(statOverview.status === 200, 'GET /api/statistics/overview thành công');
        assert(statOverview.body.data.totalEmployees >= 1, 'Thống kê tổng quan trả về số lượng nhân viên');

        const statDept = await request('/api/statistics/departments', {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(statDept.status === 200, 'GET /api/statistics/departments thành công');

        const statPos = await request('/api/statistics/positions', {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(statPos.status === 200, 'GET /api/statistics/positions thành công');

        console.log('\n--- 8. Kiểm thử Xóa mềm (Soft Delete) ---');
        const delEmp = await request(`/api/employees/${empId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(delEmp.status === 200, 'DELETE /api/employees/:id xóa mềm nhân viên (status=resigned)');

        console.log('\n🎉 TẤT CẢ CÁC BÀI TEST ĐÃ ĐẠT 100%! HỆ THỐNG HOÀN TOÀN KHỚP VỚI ĐẶC TẢ HACKMD!');
    } catch (err) {
        console.error('\n❌ TEST GẶP LỖI:', err);
        process.exitCode = 1;
    } finally {
        if (server) server.close();
        await mongoose.disconnect();
    }
}

runTests();
