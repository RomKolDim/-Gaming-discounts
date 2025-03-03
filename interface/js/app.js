import dealsController from './controllers/dealsController.js';

document.addEventListener('DOMContentLoaded', () => 
{
    try 
    {
        dealsController.init();
    } 
    catch (error) 
    {
        console.error("Ошибка при инициализации приложения:", error);
        document.getElementById("deals-container").innerHTML = `
            <div class="error-message">
                <h3>Ошибка приложения</h3>
                <p>Не удалось инициализировать приложение. Пожалуйста, обновите страницу или повторите попытку позже.</p>
            </div>
        `;
    }
});