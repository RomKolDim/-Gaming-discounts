const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());

let cachedDeals = null;
let cachedTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 минут

// Параметры для сбора всех страниц
const STORE_ID = 1;          // 1 = Steam
const MAX_PAGES = 10;        // Максимальное число страниц для обхода
const PAGE_SIZE = 20;        // Количество игр на страницу для собственной пагинации

// Функция для загрузки всех страниц из CheapShark с кешированием
async function fetchAllDeals() 
{
  const now = Date.now();
  if (cachedDeals && (now - cachedTime < CACHE_DURATION)) 
  {
    console.log("Используем кешированные данные...");
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
        console.log(`Получение страницы ${page} из API CheapShark...`);
        const response = await axios.get("https://www.cheapshark.com/api/1.0/deals", {
          params: 
          {
            storeID: STORE_ID,
            onSale: 1,
            pageNumber: page,
          },
          timeout: 10000 // 10-секундный таймаут для каждого запроса
        });
        
        //----------------------------
        // 2 Проверка на Пустой ответ
        if (!response || !response.data) 
        {
          console.warn(`Получен пустой ответ для страницы ${page}`);
          break;
        }
        
        const data = response.data;
        if (!data || data.length === 0) 
        {
          console.log(`Больше нет предложений на странице ${page}`);
          break;
        }
        //----------------------------
        
        allDeals.push(...data);
        page++;
        
        if (page >= MAX_PAGES) 
        {
          console.log(`Достигнут максимальный лимит страниц (${MAX_PAGES})`);
          break;
        }
      } 
      catch (pageError) 
      {
        console.error(`Ошибка загрузки страницы ${page}:`, pageError.message);
        
        //----------------------------
        //1  Проверка ошибок 4xx/5xx
        if (pageError.response) 
        {
          console.error(`API ответил статусом: ${pageError.response.status}`);
          
          if (pageError.response.status >= 500) 
          {
            console.error("Ошибка сервера, остановка пагинации");
            break;
          } 
          else if (pageError.response.status === 429) 
          {
            console.error("Ставка ограничена, подождите, прежде чем продолжить...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // Ждём 5 сек
            continue; // Пробуем снова
          } 
          else if (pageError.response.status >= 400) 
          {
            console.error("Ошибка клиента, остановка пагинации");
            break;
          }
        } 
        else if (pageError.request) 
        {
          console.error("Нет ответа от API, остановка пагинации");
          break;
        }
        else
        {
          console.error("Ошибка настройки запроса, остановка пагинации");
          break;
        }
        //----------------------------
        
        if (allDeals.length > 0) 
        {
          console.log(`Продолжаем рассматривать предложения ${allDeals.length} с предыдущих страниц`);
          break;
        }
        
        throw pageError;
      }
    }
    
    if (allDeals.length === 0) 
    {
      console.warn("Сделки по API не найдены!");
      return [];
    }
    
    cachedDeals = allDeals.map((deal) => 
    ({
      title: deal.title || "Unknown Title",
      salePrice: deal.salePrice || "0",
      normalPrice: deal.normalPrice || "0",
      savings: deal.savings || "0",
      thumb: deal.thumb || "",
      steamAppID: deal.steamAppID || null,
    }));
    cachedTime = now;
    console.log(`Данные загружены и кешированы: ${cachedDeals.length} игр`);
    return cachedDeals;
  } 
  catch (error) 
  {
    console.error("Неустранимая ошибка в fetchAllDeals:", error.message);
    
    //----------------------------
    // 3 резервный API
    if (cachedDeals) 
    {
      console.log("Использование устаревшего кеша в качестве запасного варианта!");
      return cachedDeals;
    }
    //----------------------------

    throw error;
  }
}

// Новый маршрут, который собирает данные со всех страниц, применяет фильтры и пагинацию
app.get("/allDeals", async (req, res) => 
{
  try 
  {
    const searchQuery = req.query.search || "";
    const exactDiscountQuery = req.query.exactDiscount || "";
    const maxPriceQuery = req.query.maxPrice || "";
    const page = parseInt(req.query.page || "0", 10);
    const pageSize = parseInt(req.query.pageSize || PAGE_SIZE, 10);

    // 1. Получаем ВСЕ данные (из кеша или с API)
    let deals;
    try 
    {
      deals = await fetchAllDeals();
    } 
    catch (fetchError) 
    {
      console.error("Ошибка при получении предложений:", fetchError.message);
      return res.status(503).json({ 
        error: "Сервис временно недоступен", 
        message: "Не удалось получить данные о скидках. Пожалуйста, попробуйте позже!" 
      });
    }

    // Проверка на действительность предложений
    if (!deals || !Array.isArray(deals)) 
    {
      console.error("Неверные данные о сделках:", deals);
      return res.status(500).json({ 
        error: "Ошибка данных", 
        message: "Получены некорректные данные. Пожалуйста, попробуйте позже!" 
      });
    }

    // 2. Фильтрация по названию (без учета регистра)
    if (searchQuery) 
    {
      try 
      {
        const lower = searchQuery.toLowerCase();
        deals = deals.filter((d) => d.title && d.title.toLowerCase().includes(lower));
      } 
      catch (searchError) 
      {
        console.error("Фильтрация ошибок по поиску:", searchError.message);
      }
    }

    // 3. Фильтрация по точной скидке (округляем savings и сравниваем)
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
        console.error("Ошибка фильтрации по скидке:", discountError.message);
      }
    }

    // 4. Фильтрация по максимальной цене (salePrice)
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
        console.error("Ошибка фильтрации по цене:", priceError.message);
      }
    }

    // 5. Собственная пагинация: разбиваем результат на страницы
    let pageDeals = [];
    try 
    {
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      pageDeals = deals.slice(startIndex, endIndex);
    } 
    catch (paginationError) 
    {
      console.error("Ошибка при нумерации страниц:", paginationError.message);
      pageDeals = deals.slice(0, pageSize); //Переход на первую страницу
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
    console.error("Критическая ошибка при получении /allDeals:", error.message);
    res.status(500).json
    ({ 
      error: "Внутренняя ошибка сервера",
      message: "Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже!"
    });
  }
});

// Глобальный обработчик ошибок для необработанных маршрутов
app.use((req, res) => 
{
  res.status(404).json({ error: "Маршрут не найден!" });
});

// Глобальный обработчик ошибок для всех остальных ошибок
app.use((err, req, res, next) => 
{
  console.error("Unhandled error:", err);
  res.status(500).json
  ({ 
    error: "Внутренняя ошибка сервера",
    message: "Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже!"
  });
});

// Обработка ошибок запуска сервера
app.listen(port, () => 
{
  console.log(`Сервер запущен на http://localhost:${port}`);
}).on('error', (err) => 
{
  console.error(`Не удалось запустить сервер: ${err.message}`);
});