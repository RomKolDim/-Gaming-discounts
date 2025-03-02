let currentPage = 0;
let currentSearch = "";
let currentExactDiscount = "";
let currentMaxPrice = "";
const maxPerPage = 60;

// Функция для отображения сообщений об ошибках пользователю
function showError(message) 
{
    const container = document.getElementById("deals-container");
    container.innerHTML = `
        <div class="error-message">
            <h3>Ошибка</h3>
            <p>${message}</p>
            <button onclick="retryLastRequest()">Повторить запрос</button>
        </div>
    `;
}

// Функция для повтора последнего запроса
function retryLastRequest() 
{
    loadDeals(currentPage, currentSearch, currentExactDiscount, currentMaxPrice);
}

async function loadDeals(page, search = "", exactDiscount = "", maxPrice = "") 
{
    try 
    {
        const container = document.getElementById("deals-container");
        container.innerHTML = "<p>Загрузка данных...</p>";
        
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
        
        //----------------------------
        // 2 не отвечает API
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15 сек тайм-аут
        
        try 
        {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeout); // Очистим таймаут, если выборка прошла успешно
            
            //----------------------------
            // 1 HTTP ошибки
            if (!response.ok) 
            {
                const errorText = await response.text();
                throw new Error(`Сервер ответил статусом: ${response.status}. Детали: ${errorText}`);
            }
            //----------------------------
            
            let data;
            try 
            {
                data = await response.json();
            } 
            catch (jsonError) 
            {
                throw new Error(`Неверный ответ JSON: ${jsonError.message}`);
            }
            
            // Проверка корректности структуры данных
            if (!data || (data.results === undefined && !Array.isArray(data))) 
            {
                throw new Error('Неверный формат данных получен с сервера!');
            }
            
            const deals = data.results || data;
            const total = data.total || deals.length;
            const pageSize = data.pageSize || maxPerPage;
            
            // Чистка контейнера
            container.innerHTML = "";
            
            if (!deals || deals.length === 0) 
            {
                container.innerHTML = "<p>Нет данных для отображения. Попробуйте изменить параметры поиска!</p>";
            } 
            else 
            {
                deals.forEach((deal) => {
                    try 
                    {
                        const card = document.createElement("div");
                        card.className = "game-card";
                        
                        const steamAppID = deal.steamAppID || '';
                        const title = deal.title || 'Название недоступно';
                        const savings = deal.savings ? parseInt(deal.savings) : 0;
                        const normalPrice = deal.normalPrice || '0';
                        const salePrice = deal.salePrice || '0';
                        const thumb = deal.thumb;
                        
                        // Формируем URL для картинки: если есть steamAppID, используем header.jpg, иначе thumb.
                        const imageUrl = steamAppID
                            ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppID}/header.jpg`
                            : thumb;
                        
                        // Если название длинное, обрезаем до определённого числа символов и добавляем троеточие.
                        const maxLength = 45;
                        let displayTitle = title;
                        if (title.length > maxLength) 
                        {
                            displayTitle = title.substring(0, maxLength) + "...";
                        }

                        //Ссылка на сайт с игрой
                        const steamUrl = steamAppID ? `https://store.steampowered.com/app/${steamAppID}` : `#`;
                        
                        card.innerHTML = `
                        <a href = "${steamUrl}">
                        <div class="image-wrapper">
                            <img 
                                src="${imageUrl}" 
                                alt="${displayTitle}" 
                                class="game-image"
                                onerror="this.onerror=null; this.src='${thumb}'"
                            >
                        </div>
                        </a>
                        <div class="info">
                            <h2 class="game-title">${displayTitle}</h2>
                            <p class="discount"><strong>${savings}%</strong></p>     
                            <div class="price-row">
                                <p class="normal-price">
                                    <s>$${normalPrice}</s>
                                </p>
                                <p class="sale-price">
                                    $${salePrice}
                                </p>
                            </div>
                        </div>
                        `;
                        container.appendChild(card);
                    } 
                    catch (cardError) 
                    {
                        console.error("Ошибка рендеринга игровой карты:", cardError);
                    }
                });
            }
            
            // Обновляем номер страницы (отображается как 1, 2, 3, ...)
            document.getElementById("page-number").innerText = page + 1;
            
            // Кнопка "Предыдущая страница" отключается на первой странице
            document.getElementById("prev-page").disabled = (page === 0);
            
            // Кнопка "Следующая страница" отключается, если нет больше данных.
            document.getElementById("next-page").disabled = ((page + 1) * pageSize >= total);
            
        } 
        catch (fetchError) 
        {
            clearTimeout(timeout);
            
            if (fetchError.name === 'AbortError') 
            {
                throw new Error('Запрос превысил время ожидания. Проверьте подключение к интернету и попробуйте снова!');
            }
            else 
            {
                throw fetchError;
            }
        }
        //----------------------------
    } 
    catch (error) 
    {
        console.error("Ошибка при загрузке данных:", error);
        
        let errorMessage = "Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже!";
        
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) 
        {
            errorMessage = "Ошибка сети. Проверьте ваше подключение к интернету и убедитесь, что сервер запущен!";
        } 
        else if (error.message.includes("timeout")) 
        {
            errorMessage = "Время ожидания ответа истекло. Сервер может быть перегружен или недоступен!";
        } 
        else if (error.message.includes("JSON")) 
        {
            errorMessage = "Получены некорректные данные от сервера. Пожалуйста, сообщите об ошибке администратору!";
        }
        showError(errorMessage);
    }
}

// Обработчики для пагинации
document.getElementById("prev-page").addEventListener("click", () => 
{
    if (currentPage > 0) 
    {
        currentPage--;
        loadDeals(currentPage, currentSearch, currentExactDiscount, currentMaxPrice);
    }
});

document.getElementById("next-page").addEventListener("click", () => 
{
    currentPage++;
    loadDeals(currentPage, currentSearch, currentExactDiscount, currentMaxPrice);
});

// Обработчик для кнопки поиска и фильтрации
function applyFilters() 
{
    try 
    {
        currentSearch = document.getElementById("search-input").value.trim();
        
        // Проверяем, что скидка представляет собой число от 0 до 100
        const discountInput = document.getElementById("exact-discount-input").value.trim();
        if (discountInput && (isNaN(parseInt(discountInput)) || parseInt(discountInput) < 0 || parseInt(discountInput) > 100)) 
        {
            alert("Пожалуйста, укажите корректную скидку (0-100%)");
            return;
        }
        currentExactDiscount = discountInput;
        
        // Проверка на положительное число
        const priceInput = document.getElementById("max-price-input").value.trim();
        if (priceInput && (isNaN(parseFloat(priceInput)) || parseFloat(priceInput) < 0)) 
        {
            alert("Пожалуйста, укажите корректную максимальную цену!");
            return;
        }
        currentMaxPrice = priceInput;
        
        currentPage = 0;
        loadDeals(currentPage, currentSearch, currentExactDiscount, currentMaxPrice);
    } 
    catch (error) 
    {
        console.error("Ошибка применения фильтров:", error);
        alert("Произошла ошибка при применении фильтров. Пожалуйста, попробуйте снова!");
    }
}

document.getElementById("search-button").addEventListener("click", applyFilters);

// Добавляем обработку нажатия Enter во всех полях
document.querySelectorAll(".search-container input").forEach(input => 
{
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
    try 
    {
        loadDeals(currentPage, currentSearch, currentExactDiscount, currentMaxPrice);
    } 
    catch (error) 
    {
        console.error("Ошибка при начальной загрузке страницы:", error);
        showError("Не удалось загрузить начальные данные. Пожалуйста, обновите страницу.");
    }
}