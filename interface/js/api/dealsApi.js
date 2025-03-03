class DealsApi 
{
    constructor() 
    {
        this.baseUrl = 'http://localhost:3000';
        this.timeout = 15000;
    }

    /**
     * Выборка сделок из серверной части с фильтрацией и разбивкой по страницам
     * @param {number} page - Номер текущей страницы (на основе 0)
     * @param {string} search - Поисковый запрос для фильтрации игр по названию
     * @param {string} exactDiscount - Точный процент скидки при фильтрации
     * @param {string} maxPrice - Максимальная цена за фильтрацию
     * @returns {Promise<Object>} - Данные о сделках
     */
    async getDeals(page = 0, search = "", exactDiscount = "", maxPrice = "") 
    {
        try 
        {
            let url = `${this.baseUrl}/allDeals?page=${page}`;
            
            if (search) 
            {
                url += `&search=${encodeURIComponent(search)}`;
            }
            if (exactDiscount) 
            {
                url += `&exactDiscount=${encodeURIComponent(exactDiscount)}`;
            }
            if (maxPrice) 
            {
                url += `&maxPrice=${encodeURIComponent(maxPrice)}`;
            }
            
            // Время ожидания установки с помощью AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(url, 
            {
                signal: controller.signal,
                headers: 
                {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            // Проверка на наличие ошибок HTTP
            if (!response.ok) 
            {
                const errorText = await response.text();
                throw new Error(`Сервер ответил сообщением о статусе: ${response.status}. Подробности: ${errorText}`);
            }
            
            // Ответ в формате JSON
            const data = await response.json();
            
            // Проверка структуры данных
            if (!data || (data.results === undefined && !Array.isArray(data))) 
            {
                throw new Error('Неверный формат данных, полученных с сервера!');
            }
            
            return data;
        } 
        catch (error) 
        {
            if (error.name === 'AbortError') 
            {
                throw new Error('Время ожидания запроса истекло. Проверьте подключение к Интернету и повторите попытку!');
            }
            throw error;
        }
    }
}

export default new DealsApi();