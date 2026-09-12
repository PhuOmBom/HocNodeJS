require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDatabase = require('./src/config/db');

const PORT = 5099;
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
                        resolve({ status: res.statusCode, body: parsed });
                    } catch (e) {
                        resolve({ status: res.statusCode, body: data });
                    }
                });
            }
        );

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ FAILED: ${message}`);
    }
    console.log(`  ✓ ${message}`);
}

async function runTests() {
    console.log('🚀 Bắt đầu kiểm thử tự động toàn diện MiniProject REST API...\n');

    await connectDatabase();
    server = app.listen(PORT);
    console.log(`Test server running at http://127.0.0.1:${PORT}`);

    let adminToken = '';
    let staffToken = '';
    let createdDeptId = '';
    let createdPosId = '';
    let createdEmpId = '';
    let createdLeaveId = '';
    const ts = Date.now();

    try {
        console.log('\n[1] Kiểm tra Root Endpoint:');
        const resRoot = await request('/');
        assert(resRoot.status === 200, 'Root endpoint trả về HTTP 200');
        assert(resRoot.body.success === true, 'Root message success là true');

        console.log('\n[2] Đăng nhập Admin:');
        const resLoginAdmin = await request('/api/auth/login', {
            method: 'POST',
            body: { email: 'admin@hr.com', password: 'password123' },
        });
        assert(resLoginAdmin.status === 200, 'Admin đăng nhập thành công HTTP 200');
        assert(!!resLoginAdmin.body.token, 'Nhận được JWT Token của Admin');
        assert(resLoginAdmin.body.user.role === 'admin', 'Role của Admin chính xác');
        adminToken = resLoginAdmin.body.token;

        console.log('\n[3] Đăng nhập Staff:');
        const resLoginStaff = await request('/api/auth/login', {
            method: 'POST',
            body: { email: 'staff@hr.com', password: 'password123' },
        });
        assert(resLoginStaff.status === 200, 'Staff đăng nhập thành công HTTP 200');
        assert(!!resLoginStaff.body.token, 'Nhận được JWT Token của Staff');
        staffToken = resLoginStaff.body.token;

        console.log('\n[4] Xem hồ sơ cá nhân qua Token:');
        const resMe = await request('/api/auth/me', {
            headers: { Authorization: `Bearer ${staffToken}` },
        });
        assert(resMe.status === 200, 'Lấy thông tin profile thành công');
        assert(resMe.body.user.email === 'staff@hr.com', 'Thông tin user khớp với token');

        console.log('\n[5] Thống kê tổng quan Dashboard:');
        const resDash = await request('/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(resDash.status === 200, 'Admin lấy số liệu dashboard HTTP 200');
        assert(resDash.body.summary.employees.total >= 4, 'Số lượng nhân viên >= 4');
        assert(resDash.body.summary.departments >= 4, 'Số lượng phòng ban >= 4');

        console.log('\n[6] Kiểm tra Phân quyền (RBAC Security):');
        const resForbidden = await request('/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${staffToken}` },
        });
        assert(resForbidden.status === 403, 'Staff không được truy cập Dashboard -> Bị từ chối HTTP 403 Forbidden chuẩn xác');

        console.log('\n[7] Quản lý Phòng ban (Departments):');
        const resGetDepts = await request('/api/departments', {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(resGetDepts.status === 200, 'Lấy danh sách phòng ban HTTP 200');
        assert(resGetDepts.body.data.length >= 4, 'Danh sách phòng ban đầy đủ');

        const resCreateDept = await request('/api/departments', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: {
                name: 'Phòng Marketing & Truyền thông',
                code: `MKT_${ts}`,
                description: 'Phụ trách chiến dịch truyền thông thương hiệu.',
            },
        });
        assert(resCreateDept.status === 201, 'Tạo phòng ban mới thành công HTTP 201');
        createdDeptId = resCreateDept.body.data._id;

        console.log('\n[8] Quản lý Chức vụ (Positions):');
        const resCreatePos = await request('/api/positions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: {
                name: 'Chuyên viên Truyền thông (Marketing Lead)',
                code: `POS_${ts}`,
                baseSalary: 22000000,
                description: 'Lên kế hoạch và thực thi chiến dịch marketing.',
            },
        });
        assert(resCreatePos.status === 201, 'Tạo chức vụ mới thành công HTTP 201');
        createdPosId = resCreatePos.body.data._id;

        console.log('\n[9] Quản lý Nhân sự (Employees):');
        const resCreateEmp = await request('/api/employees', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: {
                fullName: 'Hoàng Minh Tuấn',
                email: `tuan.${ts}@hr.com`,
                phone: `09${String(ts).slice(-8)}`,
                gender: 'male',
                dateOfBirth: '1996-12-05',
                address: '15 Lê Duẩn, Quận 1, TP.HCM',
                departmentId: createdDeptId,
                positionId: createdPosId,
                salary: 22000000,
                status: 'probation',
            },
        });
        assert(resCreateEmp.status === 201, 'Tạo nhân viên mới thành công HTTP 201');
        assert(resCreateEmp.body.data.employeeCode.startsWith('EMP'), 'Mã nhân viên được sinh tự động chuẩn');
        createdEmpId = resCreateEmp.body.data._id;

        const resGetEmp = await request(`/api/employees/${createdEmpId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(resGetEmp.status === 200, 'Xem chi tiết nhân viên thành công');
        assert(resGetEmp.body.data.departmentId.name === 'Phòng Marketing & Truyền thông', 'Populate phòng ban chuẩn xác');

        console.log('\n[10] Điểm danh & Chấm công (Attendance):');
        const resMyAtt = await request('/api/attendances/my-attendance', {
            headers: { Authorization: `Bearer ${staffToken}` },
        });
        assert(resMyAtt.status === 200, 'Staff tự xem lịch sử điểm danh của mình thành công');

        const resEmpCheckIn = await request('/api/attendances/check-in', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { employeeId: createdEmpId },
        });
        assert(resEmpCheckIn.status === 200, 'Điểm danh vào ca cho nhân viên mới thành công');

        const resEmpCheckOut = await request('/api/attendances/check-out', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { employeeId: createdEmpId },
        });
        assert(resEmpCheckOut.status === 200, 'Điểm danh ra ca thành công và tính số giờ làm');

        console.log('\n[11] Quản lý Nghỉ phép (Leave Requests):');
        const resCreateLeave = await request('/api/leaves', {
            method: 'POST',
            headers: { Authorization: `Bearer ${staffToken}` },
            body: {
                leaveType: 'sick',
                startDate: new Date(Date.now() + 86400000),
                endDate: new Date(Date.now() + 86400000 * 2),
                reason: 'Bị cảm sốt cần nghỉ dưỡng sức.',
            },
        });
        assert(resCreateLeave.status === 201, 'Nộp đơn xin nghỉ phép thành công HTTP 201');
        createdLeaveId = resCreateLeave.body.data._id;

        const resApproveLeave = await request(`/api/leaves/${createdLeaveId}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { status: 'approved' },
        });
        assert(resApproveLeave.status === 200, 'Admin phê duyệt đơn nghỉ phép thành công');
        assert(resApproveLeave.body.data.status === 'approved', 'Trạng thái đơn đã cập nhật thành approved');

        console.log('\n[12] Dọn dẹp tài nguyên tạo trong bài kiểm thử:');
        await request(`/api/employees/${createdEmpId}?hardDelete=true`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        const resDelDept = await request(`/api/departments/${createdDeptId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(resDelDept.status === 200, 'Xóa phòng ban thử nghiệm thành công');

        await request(`/api/positions/${createdPosId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` },
        });

        console.log('\n🎉 TẤT CẢ CÁC BÀI KIỂM THỬ API ĐỀU ĐẠT CHUẨN 100%! HỆ THỐNG HOẠT ĐỘNG HOÀN HẢO.\n');
    } catch (error) {
        console.error('\n❌ Có lỗi xảy ra trong quá trình kiểm thử:', error);
        process.exitCode = 1;
    } finally {
        if (server) server.close();
        process.exit(process.exitCode || 0);
    }
}

runTests();
