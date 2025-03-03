const cheapsharkService = require('../services/cheapsharkService.js');
const config = require('../config/config.js');

class DealsController 
{
    /**
     * Получите все предложения по фильтрации и разбивке на страницы
     * @param {Object} req - Объект явного запроса
     * @param {Object} res - Выразите объект ответа
     */
    async getAllDeals(req, res) 
    {
        try 
        {
            const searchQuery = req.query.search || "";
            const exactDiscountQuery = req.query.exactDiscount || "";
            const maxPriceQuery = req.query.maxPrice || "";
            const page = parseInt(req.query.page || "0", 10);
            const pageSize = parseInt(req.query.pageSize || config.PAGE_SIZE, 10);
    
            // 1. Получить ВСЕ данные (из кэша или API)
            let deals;
            try 
            {
                deals = await cheapsharkService.fetchAllDeals();
            } 
            catch (fetchError) 
            {
                console.error("Ошибка при выборке сделок:", fetchError.message);
                return res.status(503).json
                ({ 
                    error: "Услуга временно недоступна", 
                    message: "Не удалось получить данные о скидках. Пожалуйста, повторите попытку позже!" 
                });
            }
    
            // Проверка данных о сделках
            if (!deals || !Array.isArray(deals)) 
            {
                console.error("Неверные данные о сделках:", deals);
                return res.status(500).json
                ({ 
                    error: "Ошибка в данных", 
                    message: "Получены неверные данные. Пожалуйста, повторите попытку позже!" 
                });
            }
    
            // 2. Фильтровать по названию (без учета регистра)
            if (searchQuery) 
            {
                try 
                {
                    const lower = searchQuery.toLowerCase();
                    deals = deals.filter((d) => d.title && d.title.toLowerCase().includes(lower));
                } 
                catch (searchError) 
                {
                    console.error("Ошибка фильтрации поиска:", searchError.message);
                }
            }
    
            // 3. Отфильтруйте по точной скидке с округлением
            if (exactDiscountQuery) 
            {
                try 
                {
                    const discountVal = parseInt(exactDiscountQuery, 10);
                    if (!isNaN(discountVal)) 
                    {
                        deals = deals.filter((deal) => deal.savings && Math.round(parseFloat(deal.savings)) === discountVal);
                    }
                } 
                catch (discountError) 
                {
                    console.error("Ошибка фильтрации скидок:", discountError.message);
                }
            }
    
            // 4. Отфильтруйте по максимальной цене
            if (maxPriceQuery) 
            {
                try 
                {
                    const maxPrice = parseFloat(maxPriceQuery);
                    if (!isNaN(maxPrice)) 
                    {
                        deals = deals.filter((deal) => deal.salePrice && parseFloat(deal.salePrice) <= maxPrice);
                    }
                } 
                catch (priceError) 
                {
                    console.error("Ошибка фильтрации цен:", priceError.message);
                }
            }
    
            // 5. Пользовательская пагинация
            let pageDeals = [];
            try 
            {
                const startIndex = page * pageSize;
                const endIndex = startIndex + pageSize;
                pageDeals = deals.slice(startIndex, endIndex);
            } 
            catch (paginationError) 
            {
                console.error("Ошибка разбивки на страницы:", paginationError.message);
                pageDeals = deals.slice(0, pageSize);
            }
    
            res.json
            ({
                total: deals.length,
                page: page,
                pageSize: pageSize,
                results: pageDeals,
            });
        } 
        catch (error) 
        {
            console.error("Критическая ошибка в getAllDeals:", error.message);
            res.status(500).json
            ({ 
                error: "Внутренняя ошибка сервера",
                message: "Произошла непредвиденная ошибка. Пожалуйста, повторите попытку позже!"
            });
        }
    }
}

module.exports = new DealsController();