const express = require("express");
const cors = require("cors");
const config = require("./config/config.js");
const dealsRoutes = require("./routes/dealsRoutes.js");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler.js");

// Инициализировать экспресс-приложение
const app = express();

// Включить CORS для интерфейса
app.use(cors());

// Регистрация маршрутов
app.use(dealsRoutes);

// Глобальные обработчики ошибок
app.use(notFoundHandler);
app.use(errorHandler);

// Старт сервера
app.listen(config.PORT, () => 
{
    console.log(`Сервер, работающий по адресу http://localhost:${config.PORT}`);
}).on('error', (err) => 
{
    console.error(`Не удалось запустить сервер: ${err.message}`);
});