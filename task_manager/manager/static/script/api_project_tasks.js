const apiBaseUrl = '/manager/api/projects';

// Получение слага из строки адреса
function getProjectSlugFromURL() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 3]; // Предпоследний элемент, если URL вида /manager/api_page/projects/<slug>/
}

// Получение данных о проекте
async function fetchProjectData(slug) {
    const response = await fetch(`${apiBaseUrl}/${slug}/tasks/`);
    if (!response.ok) {
        console.error('Ошибка загрузки данных проекта');
        return null;
    }
    return response.json();
}

// Рендеринг задач и статусов
function renderKanbanBoard(data) {
    const kanbanBoard = document.getElementById('kanban-board');
    kanbanBoard.innerHTML = '';

    // Отображение заголовка проекта
    const projectNameElement = document.getElementById('project-name');
    projectNameElement.textContent = `Проект: ${data.project.name}`;

    // Динамическое изменение title
    document.title = `Проект: ${data.project.name}`;

    // Рендеринг колонок
    data.tasks_by_status.forEach(column => {
        const columnElement = document.createElement('div');
        columnElement.className = 'kanban-column';

        // Заголовок статуса
        const headerElement = document.createElement('div');
        headerElement.className = 'kanban-column-header';
        headerElement.textContent = column.status;
        columnElement.appendChild(headerElement);

        // Список задач
        const taskListElement = document.createElement('ul');
        taskListElement.className = 'task-list';
        taskListElement.setAttribute('data-status-id', column.id); // Привязка ID статуса
        
        column.tasks.forEach(task => {
            const taskItemElement = document.createElement('li');
            taskItemElement.className = 'task-item';
            taskItemElement.textContent = task.name;
            console.log(task.id);
            taskItemElement.setAttribute('data-task-id', task.id);// Привязка ID задачи

            taskItemElement.setAttribute('draggable', 'true');
            taskListElement.appendChild(taskItemElement);
        });
        columnElement.appendChild(taskListElement);

        kanbanBoard.appendChild(columnElement);
    });

    enableDragAndDrop(); // Активируем функционал перетаскивания
}

// Функционал перетаскивания задач
function enableDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    const taskLists = document.querySelectorAll('.task-list');

    let draggedItem = null;

    taskItems.forEach(task => {
        task.addEventListener('dragstart', () => {
            draggedItem = task;
            setTimeout(() => {
                task.classList.add('hidden'); // Прячем задачу, чтобы она не мешала перетаскиванию
            }, 0);
        });

        task.addEventListener('dragend', () => {
            draggedItem = null;
            task.classList.remove('hidden');
        });
    });

    taskLists.forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            list.classList.add('dragover'); // Подсветка столбца
        });

        list.addEventListener('dragleave', () => {
            list.classList.remove('dragover');
        });

        list.addEventListener('drop', async e => {
            e.preventDefault();
            list.classList.remove('dragover');

            if (draggedItem) {
                // Перемещаем задачу в список
                list.appendChild(draggedItem);

                // Отправляем запрос на сервер для обновления статуса задачи
                const taskId = draggedItem.getAttribute('data-task-id');
                console.log(taskId);
                const newStatusId = list.getAttribute('data-status-id');
                console.log(newStatusId);
                fetch(`/manager/tasks/${taskId}/update-status/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': '{{ csrf_token }}',
                    },
                    body: JSON.stringify({ status_id: newStatusId }),
                }).then(response => {
                    if (!response.ok) {
                        console.error('Ошибка обновления статуса задачи');
                    }
                });
            }
        });
    });
}

// Инициализация страницы
async function initializePage() {
    const projectSlug = getProjectSlugFromURL(); // Получаем слаг из URL
    const data = await fetchProjectData(projectSlug);

    if (data) {
        renderKanbanBoard(data);
    }
}

document.addEventListener('DOMContentLoaded', initializePage);