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
    console.log("Используем кешированные данные");
    return cachedDeals;
  }
  
  let allDeals = [];
  let page = 0;
  while (true) {
    const response = await axios.get("https://www.cheapshark.com/api/1.0/deals", {
      params: {
        storeID: STORE_ID,
        onSale: 1,
        pageNumber: page,
      },
    });
    const data = response.data;
    if (!data || data.length === 0) 
    {
      break;
    }
    allDeals.push(...data);
    page++;
    if (page >= MAX_PAGES) 
    {
      break;
    }
  }
  
  cachedDeals = allDeals.map((deal) => ({
    title: deal.title,
    salePrice: deal.salePrice,
    normalPrice: deal.normalPrice,
    savings: deal.savings,
    thumb: deal.thumb,
    steamAppID: deal.steamAppID,
  }));
  cachedTime = now;
  console.log("Данные загружены и кешированы");
  return cachedDeals;
}

// Новый маршрут, который собирает данные со всех страниц, применяет фильтры и пагинацию
app.get("/allDeals", async (req, res) => {
  try 
  {
    const searchQuery = req.query.search || "";
    const exactDiscountQuery = req.query.exactDiscount || "";
    const maxPriceQuery = req.query.maxPrice || "";
    // Собственная пагинация
    const page = parseInt(req.query.page || "0", 10);
    const pageSize = parseInt(req.query.pageSize || PAGE_SIZE, 10);

    // 1. Получаем ВСЕ данные (из кеша или с API)
    let deals = await fetchAllDeals();

    // 2. Фильтрация по названию (без учета регистра)
    if (searchQuery) 
    {
      const lower = searchQuery.toLowerCase();
      deals = deals.filter((d) => d.title.toLowerCase().includes(lower));
    }

    // 3. Фильтрация по точной скидке (округляем savings и сравниваем)
    if (exactDiscountQuery) 
    {
      const discountVal = parseInt(exactDiscountQuery, 10);
      if (!isNaN(discountVal)) 
      {
        deals = deals.filter((deal) => Math.round(deal.savings) === discountVal);
      }
    }

    // 4. Фильтрация по максимальной цене (salePrice)
    if (maxPriceQuery) 
    {
      const maxPrice = parseFloat(maxPriceQuery);
      if (!isNaN(maxPrice)) 
      {
        deals = deals.filter((deal) => parseFloat(deal.salePrice) <= maxPrice);
      }
    }

    // 5. Собственная пагинация: разбиваем результат на страницы
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const pageDeals = deals.slice(startIndex, endIndex);

    res.json({
      total: deals.length,
      page: page,
      pageSize: pageSize,
      results: pageDeals,
    });
  } catch (error) 
  {
    console.error("Ошибка при получении /allDeals:", error.message);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.listen(port, () => 
{
  console.log(`Сервер запущен на http://localhost:${port}`);
});