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
        window.location.href = '/manager/api_page/';
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

document.addEventListener('DOMContentLoaded', initializePage);