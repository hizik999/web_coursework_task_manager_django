function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return null;
}

const csrfToken = getCSRFToken();

const apiProjectsUrl = '/manager/api/projects/'; // URL API
        const modal = document.getElementById('modal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const createProjectBtn = document.getElementById('createProjectBtn');
        const projectNameInput = document.getElementById('projectName');

        // Функция для получения данных о проектах
        async function fetchProjects() {
            try {
                const response = await fetch(apiProjectsUrl);
                const projects = await response.json();
                const container = document.getElementById('projects-container');
                container.innerHTML = ''; // Очищаем контейнер

                // Добавляем карточки проектов
                projects.forEach(project => {
                    const card = document.createElement('div');
                    card.className = 'project-card';
                    card.textContent = project.name;
                    card.onclick = () => {
                        window.location.href = `/manager/api_page/${project.slug}/tasks/`;
                    };
                    container.appendChild(card);
                });

                // Добавляем карточку "Добавить проект"
                const addCard = document.createElement('div');
                addCard.className = 'add-card';
                addCard.textContent = '+';
                addCard.onclick = () => {
                    modal.style.display = 'flex';
                };
                container.appendChild(addCard);

            } catch (error) {
                console.error('Ошибка загрузки проектов:', error);
            }
        }

        // Закрытие модального окна
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Создание проекта
        createProjectBtn.addEventListener('click', async () => {
            const projectName = projectNameInput.value.trim();

            if (!projectName) {
                alert('Пожалуйста, заполните все поля');
                return;
            }

            try {
                
                const response = await fetch(apiProjectsUrl + "add/", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken // Убедитесь, что CSRF токен добавлен
                    },
                    body: JSON.stringify({ name: projectName })
                });

                if (response.ok) {
                    modal.style.display = 'none';
                    projectNameInput.value = '';
                    fetchProjects(); // Обновляем список проектов
                } else {
                    alert('Ошибка создания проекта');
                }
            } catch (error) {
                console.error('Ошибка при создании проекта:', error);
            }
        });

        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Загружаем проекты при загрузке страницы
        document.addEventListener('DOMContentLoaded', fetchProjects);