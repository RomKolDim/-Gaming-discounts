class DealsView 
{
    constructor() 
    {
        this.containerId = "deals-container";
        this.pageNumberId = "page-number";
        this.prevButtonId = "prev-page";
        this.nextButtonId = "next-page";
    }
    
    showLoading() 
    {
        const container = document.getElementById(this.containerId);
        if (container) 
        {
            container.innerHTML = "<p>Загрузка данных...</p>";
        }
    }
    
    /**
     * Вывод сделок в контейнер
     * @param {Array} deals - Массив объектов сделки
     */
    renderDeals(deals) 
    {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        // Чистим контейнер
        container.innerHTML = "";
        
        if (!deals || deals.length === 0) 
        {
            container.innerHTML = "<p>Нет данных для отображения. Попробуйте изменить параметры поиска!</p>";
            return;
        }
        
        deals.forEach((deal) => 
        {
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
                
                // URL-адрес формы для изображения
                const imageUrl = steamAppID
                    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppID}/header.jpg`
                    : thumb;
                
                // Если заголовок длинный, сократим его до определенного количества символов и добавим троеточия
                const maxLength = 45;
                let displayTitle = title;
                if (title.length > maxLength) 
                {
                    displayTitle = title.substring(0, maxLength) + "...";
                }

                // Ссылка на сайт игры
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
    
    /**
     * Обновление пользовательского интерфейса пагинации
     * @param {number} currentPage - Номер текущей страницы (на основе 0)
     * @param {number} total - Общее количество предметов
     * @param {number} pageSize - Элементы на странице
     */
    updatePagination(currentPage, total, pageSize) 
    {
        // Обновление отображение номера страницы (отображается на основе 1)
        const pageNumberEl = document.getElementById(this.pageNumberId);
        if (pageNumberEl) 
        {
            pageNumberEl.innerText = currentPage + 1;
        }
        
        // Кнопка "Предыдущая страница" отключена на первой странице
        const prevButton = document.getElementById(this.prevButtonId);
        if (prevButton) 
        {
            prevButton.disabled = (currentPage === 0);
        }
        
        // Кнопка "Следующая страница" отключена, если больше нет данных
        const nextButton = document.getElementById(this.nextButtonId);
        if (nextButton) 
        {
            nextButton.disabled = ((currentPage + 1) * pageSize >= total);
        }
    }
}

export default new DealsView();