let currentPage = 0;
let currentSearch = "";
let currentExactDiscount = "";
let currentMaxPrice = "";
const maxPerPage = 60;

async function loadDeals(page, search = "", exactDiscount = "", maxPrice = "") 
{
    try 
    {
        let url = `http://localhost:3000/allDeals?page=${page}`;
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
        const response = await fetch(url);
        const data = await response.json();
        const deals = data.results || data;
        const container = document.getElementById("deals-container");
        const total = data.total;  // Общее количество результатов
        const pageSize = data.pageSize; // Размер страницы
        container.innerHTML = "";

        if (!deals || deals.length === 0) 
        {
            container.innerHTML = "<p>Нет данных для отображения!</p>";
        } 
        else 
        {
            deals.forEach((deal) => {
                const card = document.createElement("div");
                card.className = "game-card";
                
                // Формируем URL для картинки: если есть steamAppID, используем header.jpg, иначе thumb.
                const imageUrl = deal.steamAppID
                    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${deal.steamAppID}/header.jpg`
                    : deal.thumb;
                
                // Если название длинное, обрезаем до определённого числа символов и добавляем троеточие.
                const maxLength = 45;
                let displayTitle = deal.title;
                if (deal.title.length > maxLength) 
                {
                    displayTitle = deal.title.substring(0, maxLength) + "...";
                }
                
                card.innerHTML = `
                <div class="image-wrapper">
                    <img 
                        src="${imageUrl}" 
                        alt="${deal.title}" 
                        class="game-image"
                        onerror="this.onerror=null; this.src='${deal.thumb}'"
                    >
                </div>
                <div class="info">
                    <h2 class="game-title">${displayTitle}</h2>
                    <p class="discount"><strong>${parseInt(deal.savings)}%</strong></p>
                    <div class="price-row">
                        <p class="normal-price">
                            <s>$${deal.normalPrice}</s>
                        </p>
                        <p class="sale-price">
                            $${deal.salePrice}
                        </p>
                    </div>
                </div>
                `;
                container.appendChild(card);
            });
        }
        
        /// Обновляем номер страницы (отображается как 1, 2, 3, ...)
        document.getElementById("page-number").innerText = page + 1;
        
        // Кнопка "Предыдущая страница" отключается на первой странице
        document.getElementById("prev-page").disabled = (page === 0);
        
        // Кнопка "Следующая страница" отключается, если нет больше данных.
        // Если (page+1)*pageSize >= total, значит следующей страницы нет.
        document.getElementById("next-page").disabled = ((page + 1) * pageSize >= total);
    } 
    catch (error) 
    {
        console.error("Ошибка при загрузке данных:", error);
    }
}

// Обработчики для пагинации
document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 0) 
    {
        currentPage--;
        loadDeals(currentPage, currentSearch, currentExactDiscount, currentMaxPrice);
    }
});

document.getElementById("next-page").addEventListener("click", () => {
    currentPage++;
    loadDeals(currentPage, currentSearch, currentExactDiscount, currentMaxPrice);
});

// Обработчик для кнопки поиска и фильтрации
function applyFilters() 
{
    currentSearch = document.getElementById("search-input").value.trim();
    currentExactDiscount = document.getElementById("exact-discount-input").value.trim();
    currentMaxPrice = document.getElementById("max-price-input").value.trim();
    currentPage = 0;
    loadDeals(currentPage, currentSearch, currentExactDiscount, currentMaxPrice);
}

document.getElementById("search-button").addEventListener("click", applyFilters);

// Добавляем обработку нажатия Enter во всех полях
document.querySelectorAll(".search-container input").forEach(input => {
    input.addEventListener("keyup", (e) => {
        if (e.key === "Enter") 
        {
            applyFilters();
        }
    });
});

// Начальная загрузка первой страницы без фильтров
window.onload = function() 
{
    loadDeals(currentPage, currentSearch, currentExactDiscount, currentMaxPrice);
}