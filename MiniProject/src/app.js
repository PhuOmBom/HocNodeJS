const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'API quản lý nhân sự chạy ok'
    });
});

app.use((req, res, next) => {
    res.status(404).json({
        message: 'API ko tồn tại'
    });
});

app.use(errorHandler);

module.exports = app;