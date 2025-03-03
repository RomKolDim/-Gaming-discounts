const banner = document.querySelector(".gaming-banner");
const images = document.querySelectorAll(".banner-image");
let currentIndex = 0;
const intervalTime = 5000;

// Клонируем первое изображение и добавляем его в конец
const firstClone = images[0].cloneNode(true);
banner.appendChild(firstClone);

function slideBanner() {
  currentIndex++;

  // Если мы достигли клонированного изображения
  if (currentIndex === images.length) {
    banner.style.transition = "transform 0.5s ease-in-out";
    banner.style.transform = `translateX(${-currentIndex * 100}%)`;

    setTimeout(() => {
      banner.style.transition = "none";
      banner.style.transform = "translateX(0%)";
      currentIndex = 0;
    }, 500);
  } else {
    banner.style.transition = "transform 0.5s ease-in-out";
    banner.style.transform = `translateX(${-currentIndex * 100}%)`;
  }
}

setInterval(slideBanner, intervalTime);
