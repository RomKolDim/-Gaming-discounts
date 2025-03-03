const axios = require('axios');
const config = require('../config/config.js');
const cacheManager = require('../utils/cacheManager.js');

class CheapSharkService 
{
    /**
     * Извлекать все предложения из CheapShark API с разбивкой на страницы и кэшированием
     * @returns {Promise<Array>} Массив сделок
     */
    async fetchAllDeals() 
    {
        const cachedDeals = cacheManager.getData(config.CACHE_DURATION);
        if (cachedDeals) 
        {
            return cachedDeals;
        }
        
        let allDeals = [];
        let page = 0;
        
        try 
        {
            while (true) 
            {
                try 
                {
                    console.log(`Извлекаю страницу ${page} из API CheapShark...`);
                    const response = await axios.get("https://www.cheapshark.com/api/1.0/deals", 
                    {
                        params: 
                        {
                            storeID: config.STORE_ID,
                            onSale: 1,
                            pageNumber: page,
                        },
                        timeout: config.API_TIMEOUT
                    });
                    
                    // Проверка на пустой ответ
                    if (!response || !response.data) 
                    {
                        console.warn(`Получен пустой ответ для страницы ${страница}`);
                        break;
                    }
                    
                    const data = response.data;
                    if (!data || data.length === 0) 
                    {
                        console.log(`Больше никаких предложений на странице ${page}`);
                        break;
                    }
                    
                    allDeals.push(...data);
                    page++;
                    
                    if (page >= config.MAX_PAGES) 
                    {
                        console.log(`Достигнут максимальный лимит страниц (${config.MAX_PAGES})`);
                        break;
                    }
                } 
                catch (pageError) 
                {
                    console.error(`Ошибка при загрузке страницы ${page}:`, pageError.message);
                    
                    // Обработка ошибок при возникновении HTTP-ошибок
                    if (pageError.response) 
                    {
                        console.error(`API ответил сообщением о статусе: ${pageError.response.status}`);
                        
                        if (pageError.response.status >= 500) 
                        {
                            console.error("Ошибка сервера, приводящая к остановке пагинации...");
                            break;
                        } 
                        else if (pageError.response.status === 429) 
                        {
                            console.error("Скорость ограничена, подождите, прежде чем продолжить...");
                            await new Promise(resolve => setTimeout(resolve, config.RATE_LIMIT_WAIT));
                            continue;
                        } 
                        else if (pageError.response.status >= 400) 
                        {
                            console.error("Ошибка клиента, приводящая к остановке пагинации...");
                            break;
                        }
                    } 
                    else if (pageError.request) 
                    {
                        console.error("Нет ответа от API, что приводит к остановке пагинации...");
                        break;
                    } 
                    else 
                    {
                        console.error("Ошибка настройки запроса, приводящая к остановке пагинации...");
                        break;
                    }
                    
                    if (allDeals.length > 0) {
                        console.log(`Продолжаем обзор ${allDeals.length} предложений с предыдущих страниц`);
                        break;
                    }
                    
                    throw pageError;
                }
            }
            
            if (allDeals.length === 0) 
            {
                console.warn("Никаких сделок через API найдено не было!");
                return [];
            }
            
            // Преобразование данных в чистый формат
            const mappedDeals = allDeals.map((deal) => 
            ({
                title: deal.title || "Неизвестное название",
                salePrice: deal.salePrice || "0",
                normalPrice: deal.normalPrice || "0",
                savings: deal.savings || "0",
                thumb: deal.thumb || "",
                steamAppID: deal.steamAppID || null,
            }));
            
            // Кэшируем результаты
            cacheManager.setData(mappedDeals);
            console.log(`Загруженные и кэшированные данные: ${mappedDeals.length} игр`);
            return mappedDeals;
        } 
        catch (error) 
        {
            console.error("Неустранимая ошибка при выборке всех сделок:", error.message);
            
            // Попробуем использовать резервный кэш в качестве запасного варианта
            if (cacheManager.cache) 
            {
                console.log("Использование резервного кэша в качестве запасного варианта!");
                return cacheManager.cache;
            }
            
            throw error;
        }
    }
}

module.exports = new CheapSharkService();