class ErrorHandler 
{
    /**
     * Отобразить пользователю сообщение об ошибке
     * @param {string} message - Отображаемое сообщение об ошибке
     * @param {string} containerId - Идентификатор контейнера для отображения ошибки в
     * @param {Function} retryCallback - Функция, вызываемая при нажатии кнопки повторить попытку
     */
    showError(message, containerId = "deals-container", retryCallback = null) 
    {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-message">
                <h3>Ошибка</h3>
                <p>${message}</p>
                ${retryCallback ? '<button id="retry-button">Попробовать снова</button>' : ''}
            </div>
        `;
        
        if (retryCallback) 
        {
            document.getElementById("retry-button").addEventListener("click", retryCallback);
        }
    }
    
    /**
     * Получение удобное для пользователя сообщение об ошибке, основанное на самой ошибке
     * @param {Error} error - Обнаруженная ошибка
     * @returns {string} - Удобное для пользователя сообщение об ошибке
     */
    getErrorMessage(error) 
    {
        if (!error) return "An unknown error occurred.";
        
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) 
        {
            return "Ошибка сети. Проверьте свое интернет-соединение и убедитесь, что сервер запущен!";
        } 
        else if (error.message.includes("timeout")) 
        {
            return "Время выполнения запроса истекло. Возможно, сервер перегружен или недоступен!";
        } 
        else if (error.message.includes("JSON")) 
        {
            return "Неверные данные, полученные с сервера. Пожалуйста, сообщите об этой ошибке администратору!";
        }
        
        return error.message || "Произошла ошибка при загрузке данных. Пожалуйста, повторите попытку позже!";
    }
}

export default new ErrorHandler();