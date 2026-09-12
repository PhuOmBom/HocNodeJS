function convertEmployeesToCsv(employees) {
    const headers = ['Mã nhân viên', 'Họ tên', 'Email', 'Số điện thoại', 'Phòng ban', 'Chức vụ', 'Trạng thái'];

    const rows = employees.map((emp) => {
        const deptName = emp.departmentId?.name || (typeof emp.departmentId === 'string' ? emp.departmentId : '');
        const posName = emp.positionId?.name || (typeof emp.positionId === 'string' ? emp.positionId : '');

        return [
            `"${(emp.employeeCode || '').replace(/"/g, '""')}"`,
            `"${(emp.fullName || '').replace(/"/g, '""')}"`,
            `"${(emp.email || '').replace(/"/g, '""')}"`,
            `"${(emp.phone || '').replace(/"/g, '""')}"`,
            `"${deptName.replace(/"/g, '""')}"`,
            `"${posName.replace(/"/g, '""')}"`,
            `"${(emp.status || '').replace(/"/g, '""')}"`,
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
}

module.exports = {
    convertEmployeesToCsv,
};
