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

async function loadStatuses() {
    const taskStatusSelect = document.getElementById('task-status');

    // Очищаем старые опции
    taskStatusSelect.innerHTML = '';

    try {
        const response = await fetch('/manager/api/statuses/');
        if (!response.ok) {
            console.error('Ошибка загрузки статусов');
            return;
        }

        const statuses = await response.json();

        // Заполняем выпадающий список
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status.id;
            option.textContent = status.name;
            taskStatusSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Открытие модального окна для добавления задачи
function renderAddTaskButton(taskListElement, statusId) {
    const addTaskButton = document.createElement('li');
    addTaskButton.className = 'task-item add-task-button';
    addTaskButton.textContent = '+';
    addTaskButton.onclick = async () => {
        const addTaskModal = document.getElementById('add-task-modal');
        const taskStatusSelect = document.getElementById('task-status');

        // Загружаем статусы при открытии модального окна
        await loadStatuses();

        // Устанавливаем текущий статус в select
        if (statusId) {
            taskStatusSelect.value = statusId;
        }

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

        // Отображение задач
        column.tasks.forEach(task => {
            const taskItemElement = document.createElement('li');
            taskItemElement.className = 'task-item';
            taskItemElement.textContent = task.name;
            taskItemElement.setAttribute('data-task-id', task.id);
            taskItemElement.setAttribute('draggable', 'true');
            taskListElement.insertBefore(taskItemElement, taskListElement.lastElementChild);
        });

        renderAddTaskButton(taskListElement, column.id);
        columnElement.appendChild(taskListElement);
        kanbanBoard.appendChild(columnElement);
    });

    enableDragAndDrop(); // Активируем функционал перетаскивания
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
    const taskItems = document.querySelectorAll('.task-item:not(.add-task-button)');
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

        list.addEventListener('drop', e => {
            e.preventDefault();
            list.classList.remove('dragover');

            if (draggedItem) {
                const addTaskButton = list.querySelector('.add-task-button');
                list.insertBefore(draggedItem, addTaskButton); // Перемещаем задачу перед кнопкой

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

// Удаление проекта
deleteButton.addEventListener('click', () => {
    deleteModal.style.display = 'flex';
});

confirmButton.addEventListener('click', async () => {
    const projectSlug = window.location.pathname.split('/')[window.location.pathname.split('/').length - 3];
    const response = await fetch(`/manager/api/projects/${projectSlug}/delete/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
    });

    if (response.ok) {
        alert('Проект успешно удален!');
        window.location.href = '/manager/api_page/projects/';
    } else {
        alert('Ошибка удаления проекта');
    }
});

cancelDeleteButton.addEventListener('click', () => {
    deleteModal.style.display = 'none';
});

// Редактирование проекта
editButton.addEventListener('click', () => {
    editModal.style.display = 'flex';
});

saveButton.addEventListener('click', async () => {
    const projectSlug = window.location.pathname.split('/')[window.location.pathname.split('/').length - 3];
    console.log(window.location.pathname.split('/'));
    const newName = newProjectNameInput.value.trim();
    const newSlug = newProjectSlugInput.value.trim();
    console.log("{{ csrf_token }}")
    if (newName) {
        const response = await fetch(`/manager/api/projects/${projectSlug}/edit/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ name: newName, slug: projectSlug, new_slug: newSlug }),
        });

        if (response.ok) {
            alert('Название успешно изменено!');
            window.location.href = `/manager/api_page/${newSlug}/tasks/`;
            // const data = await response.json();
            // document.getElementById('project-name').textContent = `Проект: ${data.name}`;
            // document.title = `Проект: ${data.name}`;

        } else {
            alert('Ошибка изменения названия проекта');
        }
        editModal.style.display = 'none';
    }
});

cancelEditButton.addEventListener('click', () => {
    editModal.style.display = 'none';
});

// Инициализация страницы
async function initializePage() {
    const projectSlug = getProjectSlugFromURL();
    const data = await fetchProjectData(projectSlug);

    if (data) {
        renderKanbanBoard(data);
    }
}

document.addEventListener('DOMContentLoaded', initializePage);