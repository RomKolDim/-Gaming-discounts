import dealsApi from '../api/dealsApi.js';
import dealsView from '../views/dealsView.js';
import errorHandler from '../utils/errorHandler.js';

class DealsController 
{
    constructor() 
    {
        this.currentPage = 0;
        this.currentSearch = "";
        this.currentExactDiscount = "";
        this.currentMaxPrice = "";
        this.maxPerPage = 60;
    }
    
    init() 
    {
        // Настройка прослушивателей событий разбивки на страницы
        document.getElementById("prev-page").addEventListener("click", () => this.prevPage());
        document.getElementById("next-page").addEventListener("click", () => this.nextPage());
        
        // Настройка кнопки поиска
        document.getElementById("search-button").addEventListener("click", () => this.applyFilters());
        
        // Добавление обработчик ввода ключа для всех входных данных поиска
        document.querySelectorAll(".search-container input").forEach(input => 
        {
            input.addEventListener("keyup", (e) => 
            {
                if (e.key === "Enter") 
                {
                    this.applyFilters();
                }
            });
        });
        
        this.loadDeals();
    }
    
    prevPage() 
    {
        if (this.currentPage > 0) 
        {
            this.currentPage--;
            this.loadDeals();
        }
    }
    
    nextPage() 
    {
        this.currentPage++;
        this.loadDeals();
    }
    
    applyFilters() 
    {
        try 
        {
            // Получение поискового запроса
            this.currentSearch = document.getElementById("search-input").value.trim();
            
            // Действительная скидка - это число в диапазоне от 0 до 100
            const discountInput = document.getElementById("exact-discount-input").value.trim();
            if (discountInput && (isNaN(parseInt(discountInput)) || parseInt(discountInput) < 0 || parseInt(discountInput) > 100)) 
            {
                alert("Пожалуйста, укажите действующую скидку (0-100%).");
                return;
            }
            this.currentExactDiscount = discountInput;
            
            // Подтверждающая цена - это положительное число
            const priceInput = document.getElementById("max-price-input").value.trim();
            if (priceInput && (isNaN(parseFloat(priceInput)) || parseFloat(priceInput) < 0)) 
            {
                alert("Пожалуйста, введите действительную максимальную цену!");
                return;
            }
            this.currentMaxPrice = priceInput;
            
            // Сброс на первую страницу при смене фильтров
            this.currentPage = 0;
            this.loadDeals();
        } 
        catch (error) 
        {
            console.error("Ошибка при применении фильтров:", error);
            alert("Произошла ошибка при применении фильтров. Пожалуйста, повторите попытку!");
        }
    }
    
    async loadDeals() 
    {
        try 
        {
            dealsView.showLoading();
            
            // Извлечение данных из API
            const data = await dealsApi.getDeals
            (
                this.currentPage,
                this.currentSearch,
                this.currentExactDiscount,
                this.currentMaxPrice
            );
            
            // Получение массив сделок и метаданные
            const deals = data.results || data;
            const total = data.total || deals.length;
            const pageSize = data.pageSize || this.maxPerPage;
            
            // Рендеринг сделок в пользовательском интерфейсе
            dealsView.renderDeals(deals);
            
            // Обновление элементов управления пагинации
            dealsView.updatePagination(this.currentPage, total, pageSize);
            
        } 
        catch (error) 
        {
            console.error("Ошибка при загрузке данных:", error);
            const errorMessage = errorHandler.getErrorMessage(error);
            errorHandler.showError(errorMessage, "deals-container", () => this.loadDeals());
        }
    }
    
    retryLastRequest() 
    {
        this.loadDeals();
    }
}

export default new DealsController();