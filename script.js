// создавать веб-приложение, используя html, css и js. Конечный результат должен представлять собой систему для получения записей о постах, используя пагинацию (способ разбиения большого объема данных (например, список товаров или статей) на отдельные страницы (порции) для удобного отображения и загрузки (Данные не загружаются все сразу)).

// Создаем экземпляр axios для работы с API
const axiosClient = axios.create({
    baseURL: 'https://dummyjson.com' // Базовый URL для всех запросов
});

// обработка полученного ответа с помощью интерцептора (перехватчика)
axiosClient.interceptors.response.use(
    // При успешном ответе возвращаем только данные (response.data) или пустой массив
    response => response.data || [],
    // При ошибке логируем ее и передаем дальше
    error => {
        if (error.response) {
            console.error('Server error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// константа API_ENDPOINTS - объект с конечными точками API
const API_ENDPOINTS = {
    POSTS: '/posts' // Конечная точка для получения постов
};

//{"posts":[{"id":1,"title":"His mother...","body":"His mother had...","tags":["history","american","crime"],"reactions":{"likes":192,"dislikes":25},"views":305,"userId":121},{"id":2...],...,"total":251,"skip":0,"limit":30}

// Переменные для пагинации
let skipPosts = 0; // Сколько постов уже пропущено
const limitPosts = 10; // Сколько постов загружать за раз
let isGetPostsInProgress = false; // Флаг выполнения запроса
let hasMorePosts = true; // Есть ли еще посты для загрузки

// Функция создания DOM-элемента поста
function createPostElement(post) {
    // Создаем контейнер для поста
    const postElement = document.createElement('div');
    postElement.className = 'post'; // Добавляем CSS-класс

    // Создаем заголовок поста
    const title = document.createElement('h3');
    title.textContent = post.title; // Устанавливаем текст заголовка
    
    // Создаем тело поста
    const body = document.createElement('p');
    body.textContent = post.body; // Устанавливаем текст поста
    
    // Создаем контейнер для тегов
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'tags';
    
    // Добавляем каждый тег как отдельный элемент
    post.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
    });

    // Создаем контейнер статистики (реакции и просмотры)
    const statsContainer = document.createElement('div');
    statsContainer.className = 'post-stats';

    // Просмотры
    const views = document.createElement('span');
    views.className = 'views';
    views.innerHTML = `👁️ ${post.views || 0}`;

       // Создаем контейнер реакций (лайки/дизлайки)
       const reactionsContainer = document.createElement('div');
       reactionsContainer.className = 'reactions';
   
       // Инициализируем счетчики лайков и дизлайков
       let likesCount = post.reactions?.likes || 0;
       let dislikesCount = post.reactions?.dislikes || 0;
   
       // Лайки - делаем кликабельными
       const likes = document.createElement('button'); // Меняем span на button
       likes.className = 'likes';
       likes.innerHTML = `👍 <span class="count">${likesCount}</span>`;
       likes.title = "Нажмите, чтобы поставить лайк";
       
       // Добавляем обработчик клика для лайков
       likes.addEventListener('click', function() {
           likesCount++;
           this.querySelector('.count').textContent = likesCount;
           // Анимация для визуального отклика
           this.classList.add('liked');
           setTimeout(() => this.classList.remove('liked'), 300);
       });
   
       // Дизлайки - делаем кликабельными
       const dislikes = document.createElement('button'); // Меняем span на button
       dislikes.className = 'dislikes';
       dislikes.innerHTML = `👎 <span class="count">${dislikesCount}</span>`;
       dislikes.title = "Нажмите, чтобы поставить дизлайк";
       
       // Добавляем обработчик клика для дизлайков
       dislikes.addEventListener('click', function() {
           dislikesCount++;
           this.querySelector('.count').textContent = dislikesCount;
           // Анимация для визуального отклика
           this.classList.add('disliked');
           setTimeout(() => this.classList.remove('disliked'), 300);
       });

    // Собираем блок реакций
    reactionsContainer.append(likes, dislikes);
    
    // Собираем всю статистику
    statsContainer.append(views, reactionsContainer);

    // Собираем все элементы вместе внутри контейнера для поста
    postElement.append(title, body, tagsContainer, statsContainer);
    return postElement;
}

// Функция загрузки постов
function getPosts() {
    // Если уже идет загрузка или постов больше нет - выходим
    if (isGetPostsInProgress || !hasMorePosts) return;
    isGetPostsInProgress = true; // Устанавливаем флаг загрузки

    // Делаем GET-запрос к API
    axiosClient.get(API_ENDPOINTS.POSTS, {
        params: { skip: skipPosts, limit: limitPosts } // Параметры пагинации (сколько постов пропустить, сколько постов вернуть)
    })
    // В случае успешного ответа от сервера
    .then(response => {
        const posts = response.posts; // получаем массив постов
        const total = response.total; // получаем общее количество постов
        // Если нет постов - устанавливаем флаг и выходим
        if (!posts || posts.length === 0) {
            hasMorePosts = false;
            return;
        }
        // Если посты есть:
        // Находим контейнер для постов
        const container = document.getElementById('post-container');
        // Для каждого поста создаем элемент и добавляем в DOM
        posts.forEach(post => {
            container.appendChild(createPostElement(post));
        });
        
        // Увеличиваем счетчик пропущенных постов
        skipPosts += posts.length;
        // Проверяем, есть ли еще посты
        hasMorePosts = skipPosts < total;
    })
     // В случае если запрос завершился с ошибкой
    .catch(error => {
        // Логируем ошибку, если запрос не удался
        console.error('Ошибка при загрузке постов:', error);
    })
    // В любом случае
    .finally(() => {
        // Снимаем флаг загрузки
        isGetPostsInProgress = false;
    });
}

// Функция обработки скролла
function handleScroll() {
    // Получаем параметры скролла (Прокрученные px вверху, Полная высота всего содержимого страницы, Высота видимой области окна браузера)
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const scrollThreshold = 5; // Запас в пикселях до нижнего края
    
    // Если прокрутили почти до конца - загружаем новые посты
    if (scrollTop + clientHeight >= scrollHeight - scrollThreshold) {
        getPosts();
    }
}

// Функция настройки кнопки "Наверх"
function setupBackToTopButton() {
    const backButton = document.getElementById('back-to-top');
    const scrollThreshold = 200; // Порог появления кнопки
    
    // Следим за скроллом
    window.addEventListener('scroll', () => {
        // Показываем/скрываем кнопку в зависимости от положения
        backButton.style.display = window.scrollY > scrollThreshold ? 'block' : 'none';
        //  Если прокрутили больше чем scrollThreshold, показываем кнопку
        //  Иначе скрываем кнопку
    });
    
    // Обработчик клика - плавный скролл наверх
    backButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    setupBackToTopButton(); // Настраиваем кнопку
    getPosts(); // Загружаем первые посты
});

// Вешаем обработчик скролла на окно
window.addEventListener('scroll', handleScroll);