const notFoundHandler = (req, res) => 
    {
        res.status(404).json({ error: "Маршрут не найден!" });
    };
    
    const errorHandler = (err, req, res, next) => 
    {
        console.error("Необработанная ошибка:", err);
        res.status(500).json
        ({ 
            error: "Внутренняя ошибка сервера",
            message: "Произошла непредвиденная ошибка. Пожалуйста, повторите попытку позже!"
        });
    };
    
    module.exports = 
    {
        notFoundHandler,
        errorHandler
    };