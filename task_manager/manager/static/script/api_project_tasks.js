const apiBaseUrl = '/manager/api/projects';
const deleteButton = document.getElementById('delete-project');
const editButton = document.getElementById('edit-project');
const deleteModal = document.getElementById('delete-modal');
const editModal = document.getElementById('edit-modal');
const confirmButton = document.querySelector('.confirm-button');
const cancelDeleteButton = document.querySelector('#delete-modal .cancel-button');
const cancelEditButton = document.querySelector('#edit-modal .cancel-button');
const saveButton = document.querySelector('.save-button');
const newProjectNameInput = document.getElementById('new-project-name');
const newProjectSlugInput = document.getElementById('new-project-slug');

// Получение CSRF-токена
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

// Получение слага из строки адреса
function getProjectSlugFromURL() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 3];
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

// Получение статусов из API
async function fetchStatuses() {
    const response = await fetch('/manager/api/statuses/');
    if (!response.ok) {
        console.error('Ошибка загрузки статусов');
        return [];
    }
    return response.json();
}

// Открытие модального окна для добавления задачи
function renderAddTaskButton(taskListElement, statusId) {
    const addTaskButton = document.createElement('button');
    addTaskButton.className = 'add-task-button';
    addTaskButton.textContent = '+';

    addTaskButton.onclick = async () => {
        const addTaskModal = document.getElementById('add-task-modal');
        const taskStatusSelect = document.getElementById('task-status');

        // Загрузка статусов в select
        const statuses = await fetchStatuses();
        taskStatusSelect.innerHTML = ''; // Очищаем старые опции
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status.id;
            option.textContent = status.name;
            if (status.id === statusId) {
                option.selected = true; // Выбираем текущий статус
            }
            taskStatusSelect.appendChild(option);
        });

        addTaskModal.style.display = 'flex';
    };

    taskListElement.appendChild(addTaskButton);
}

// Закрытие модального окна
const cancelAddTaskButton = document.querySelector('#add-task-modal .cancel-button');
cancelAddTaskButton.addEventListener('click', () => {
    const addTaskModal = document.getElementById('add-task-modal');
    addTaskModal.style.display = 'none';
});

// Рендеринг задач и статусов
function renderKanbanBoard(data) {
    const kanbanBoard = document.getElementById('kanban-board');
    kanbanBoard.innerHTML = '';

    // Отображение заголовка проекта
    const projectNameElement = document.getElementById('project-name');
    projectNameElement.textContent = `Проект: ${data.project.name}`;

    // Динамическое изменение title
    document.title = `Проект: ${data.project.name}`;

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
        taskListElement.setAttribute('data-status-id', column.id);

        column.tasks.forEach(task => {
            const taskItemElement = document.createElement('li');
            taskItemElement.className = 'task-item';
            taskItemElement.textContent = task.name;
            taskItemElement.setAttribute('data-task-id', task.id);
            taskItemElement.setAttribute('draggable', 'true');
            taskListElement.appendChild(taskItemElement);
        });

        renderAddTaskButton(taskListElement, column.id);
        columnElement.appendChild(taskListElement);

        kanbanBoard.appendChild(columnElement);
    });

    enableDragAndDrop();
}

// Отправка данных задачи на сервер
document.getElementById('add-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const projectSlug = getProjectSlugFromURL();
    const name = document.getElementById('task-name').value;
    const content = document.getElementById('task-content').value;
    const statusId = document.getElementById('task-status').value;
    const deadlineDate = document.getElementById('task-deadline-date').value;
    const deadlineTime = document.getElementById('task-deadline-time').value;
    const deadline = deadlineDate && deadlineTime ? `${deadlineDate}T${deadlineTime}` : null;

    const response = await fetch(`/manager/api/projects/${projectSlug}/tasks/add/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({
            name,
            content,
            status: statusId,
            deadline,
            slug: projectSlug
        }),
    });

    if (response.ok) {
        alert('Задача успешно добавлена!');
        document.getElementById('add-task-modal').style.display = 'none';
        initializePage();
    } else {
        alert('Ошибка добавления задачи');
    }
});

// Функционал перетаскивания задач
function enableDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    const taskLists = document.querySelectorAll('.task-list');

    let draggedItem = null;

    taskItems.forEach(task => {
        task.addEventListener('dragstart', () => {
            draggedItem = task;
            setTimeout(() => {
                task.classList.add('hidden');
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
            list.classList.add('dragover');
        });

        list.addEventListener('dragleave', () => {
            list.classList.remove('dragover');
        });

        list.addEventListener('drop', async e => {
            e.preventDefault();
            list.classList.remove('dragover');

            if (draggedItem) {
                list.appendChild(draggedItem);

                const taskId = draggedItem.getAttribute('data-task-id');
                const newStatusId = list.getAttribute('data-status-id');

                fetch(`/manager/tasks/${taskId}/update-status/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken(),
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
    const projectSlug = getProjectSlugFromURL();
    const data = await fetchProjectData(projectSlug);

    if (data) {
        renderKanbanBoard(data);
    }
}

document.addEventListener('DOMContentLoaded', initializePage);