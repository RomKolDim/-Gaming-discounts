class CacheManager 
{
    constructor() 
    {
        this.cache = null;
        this.cacheTime = 0;
    }

    /**
     * Извлекать данные из кэша, если они верны, в противном случае возвращать значение null
     * @param {number} duration Длительность кэширования в миллисекундах
     * @returns {null|*} Кэшированные данные или null, если они недействительны/пусты
     */
    getData(duration) 
    {
        const now = Date.now();
        if (this.cache && (now - this.cacheTime < duration)) 
        {
            console.log("Использование кэшированных данных...");
            return this.cache;
        }
        return null;
    }

    /**
     * Сохранение данных в кэш
     * @param {*} data Данные для кэширования
     */
    setData(data) 
    {
        this.cache = data;
        this.cacheTime = Date.now();
    }

    /**
     * Проверьте, есть ли в кэше допустимые данные
     * @param {number} duration Длительность кэширования в миллисекундах
     * @returns {boolean} Истинно, если кэш действителен
     */
    isValid(duration) 
    {
        const now = Date.now();
        return this.cache && (now - this.cacheTime < duration);
    }
}

module.exports = new CacheManager();