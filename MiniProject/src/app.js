const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Hệ thống REST API Quản lý Nhân sự đang hoạt động',
        endpoints: {
            auth: '/api/auth',
            departments: '/api/departments',
            positions: '/api/positions',
            employees: '/api/employees',
            attendances: '/api/attendances',
            leaves: '/api/leaves',
            profile: '/api/profile',
            statistics: '/api/statistics',
        },
    });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/positions', require('./routes/position.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/attendances', require('./routes/attendance.routes'));
app.use('/api/leaves', require('./routes/leave.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/statistics', require('./routes/statistic.routes'));

app.use((req, res, next) => {
    res.status(404).json({
        message: `API không tồn tại: [${req.method}] ${req.originalUrl}`,
    });
});

app.use(errorHandler);

module.exports = app;