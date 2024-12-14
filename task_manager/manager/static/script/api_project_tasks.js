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
    const response = await fetch(`/manager/api/tasks/grouped-by-status/?project_slug=${slug}`);
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

// Получение информации о задаче
async function fetchTaskData(taskId) {
    const response = await fetch(`/manager/api/tasks/${taskId}/`);
    if (!response.ok) {
        console.error('Ошибка загрузки данных задачи');
        return null;
    }
    return response.json();
}

// Открытие модального окна с информацией о задаче
function openTaskModal(task) {
    const taskModal = document.getElementById('task-modal');
    document.getElementById('task-modal-name').textContent = task.name;
    document.getElementById('task-modal-status').textContent = task.status_name;
    document.getElementById('task-modal-content').textContent = task.content || 'Описание отсутствует';
    document.getElementById('task-modal-deadline').textContent = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : 'Нет дедлайна';
    document.getElementById('delete-task-button').setAttribute('data-task-id', task.id);
    taskModal.style.display = 'flex';
}

// Закрытие модального окна
// document.getElementById('close-task-modal').addEventListener('click', () => {
//     document.getElementById('task-modal').style.display = 'none';
// });

// Добавьте обработчик на карточки задач
function addTaskClickHandlers() {
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(taskItem => {
        if (!taskItem.classList.contains('add-task-button')) {
            taskItem.addEventListener('click', async () => {
                const taskId = taskItem.getAttribute('data-task-id');
                const taskData = await fetchTaskData(taskId);
                if (taskData) {
                    openTaskModal(taskData);
                } else {
                    alert('Не удалось загрузить информацию о задаче');
                }
            });    
        }
    });
}

// Открытие модального окна для редактирования проекта
editButton.addEventListener('click', () => {
    editModal.style.display = 'flex';
});

// Открытие модального окна для добавления задачи
function renderAddTaskButton(taskListElement, statusId) {
    const addTaskButton = document.createElement('li');
    addTaskButton.className = 'add-task-button';
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

// Закрытие модального окна при клике на область вне модального содержимого
// document.getElementById('task-modal').addEventListener('click', (event) => {
//     const modalContent = document.querySelector('.modal-content');
//     if (!modalContent.contains(event.target)) {
//         document.getElementById('task-modal').style.display = 'none';
//     }
// });

// Закрытие модального окна
const cancelAddTaskButton = document.querySelector('#add-task-modal .cancel-button');
cancelAddTaskButton.addEventListener('click', () => {
    const addTaskModal = document.getElementById('add-task-modal');
    addTaskModal.style.display = 'none';
});


// document.getElementById('add-task-modal').addEventListener('click', (event) => {
//     const modalContent = document.querySelector('.modal-content');
//     if (!modalContent.contains(event.target)) {
//         document.getElementById('add-task-modal').style.display = 'none';
//     }
// });

// Рендеринг задач и статусов
function renderKanbanBoard(data) {
    const kanbanBoard = document.getElementById('kanban-board');
    kanbanBoard.innerHTML = '';
    document.getElementById('project-name').textContent = `${data.project.name}`;
    document.title = `${data.project.name}`;
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
            taskItemElement.setAttribute('data-task-id', task.id); // Используем id
            taskItemElement.setAttribute('data-task-status', task.status);
            taskItemElement.setAttribute('data-task-slug', task.slug);
            taskItemElement.setAttribute('draggable', 'true');
            taskListElement.appendChild(taskItemElement);
        });

        renderAddTaskButton(taskListElement, column.id);
        columnElement.appendChild(taskListElement);

        kanbanBoard.appendChild(columnElement);
    });

    enableDragAndDrop();
    addTaskClickHandlers(); // Добавляем обработчики для открытия модалки
}

// пасхалка (забавная) тут если поменять task-modal на cancel-button, то удалится кнопка ахахахаах
document.getElementById("cancel-button").addEventListener("click", async () => {
    document.getElementById("task-modal").style.display = "none";
});

document.getElementById('delete-task-button').addEventListener('click', async () => {
    const taskID = document.getElementById('delete-task-button').getAttribute('data-task-id');
    console.log(taskID);
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        const response = await fetch(`/manager/api/tasks/${taskID}/delete_task/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
        });

        if (response.ok) {
            //alert('Задача успешно удалена!');
            document.getElementById('task-modal').style.display = 'none';
            initializePage(); // Обновление задач на странице
        } else {
            alert('Ошибка удаления задачи.');
        }
    }
});

// Отправка данных задачи на сервер
document.getElementById('add-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const projectSlug = getProjectSlugFromURL();
    const name = document.getElementById('task-name').value;
    const content = document.getElementById('task-content').value;
    const statusId = document.getElementById('task-status').value;
    const deadlineDate = document.getElementById('task-deadline-date').value;

    const response = await fetch(`/manager/api/projects/${projectSlug}/tasks/add_task/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({
            name,
            content,
            status: statusId,
            deadline: deadlineDate,
            // slug: projectSlug
        }),
    });

    if (response.ok) {
        //alert('Задача успешно добавлена!');
        document.getElementById('add-task-modal').style.display = 'none';
        initializePage();
    } else {
        alert('Ошибка добавления задачи');
    }
});

// Показать форму редактирования
document.getElementById('edit-task-button').addEventListener('click', () => {
    // Скрываем основное содержимое и показываем форму
    document.getElementById('task-modal-content').style.display = 'none';
    document.getElementById('task-modal-deadline').style.display = 'none';
    document.getElementById('task-modal-buttons').style.display = 'none';

    const editForm = document.getElementById('edit-task-form');
    editForm.style.display = 'block';

    // Заполняем поля формы текущими значениями
    const currentContent = document.getElementById('task-modal-content').textContent;
    const currentDeadline = document.getElementById('task-modal-deadline').textContent;

    document.getElementById('edit-task-content').value = currentContent.trim();
    document.getElementById('edit-task-deadline').value = currentDeadline;
});

// Отменить редактирование
document.getElementById('cancel-edit-task').addEventListener('click', () => {
    const editForm = document.getElementById('edit-task-form');
    editForm.style.display = 'none';

    // Показываем обратно основное содержимое
    document.getElementById('task-modal-content').style.display = 'block';
    document.getElementById('task-modal-deadline').style.display = 'block';
    document.getElementById('task-modal-buttons').style.display = 'flex';
});

// Сохранить изменения
document.getElementById('edit-task-form').addEventListener('submit', (event) => {
    event.preventDefault();
    // document.getElementById('task-modal-content-p').style.display = 'block';
    // document.getElementById('task-modal-deadline-p').style.display = 'block';
    const taskId = document.getElementById('delete-task-button').getAttribute('data-task-id');
    const updatedContent = document.getElementById('edit-task-content').value;
    const updatedDeadline = document.getElementById('edit-task-deadline').value;

    // Отправляем PATCH запрос на сервер
    fetch(`/manager/api/tasks/${taskId}/update/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({
            content: updatedContent,
            deadline: updatedDeadline,
            //name: document.getElementById('edit-task-name').value,
            //status: document.getElementById('edit-task-status').value
        }),
    })
        .then((response) => {
            if (response.ok) {
                //alert('Задача успешно обновлена!');
                // Обновляем содержимое модалки
                document.getElementById('task-modal-content').textContent = updatedContent;
                document.getElementById('task-modal-deadline').textContent = new Date(updatedDeadline).toLocaleString();

                // Скрываем форму редактирования и показываем основное содержимое
                document.getElementById('edit-task-form').style.display = 'none';
                document.getElementById('task-modal-content').style.display = 'block';
                document.getElementById('task-modal-deadline').style.display = 'block';
                document.getElementById('task-modal-buttons').style.display = 'flex';
            } else {
                alert('Ошибка обновления задачи!');
            }
        })
        .catch((error) => console.error('Ошибка:', error));
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
                const taskSlug = draggedItem.getAttribute('data-task-slug');
                const newStatusId = list.getAttribute('data-status-id');

                fetch(`/manager/api/tasks/${taskId}/update_status/`, {
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
    const response = await fetch(`/manager/api/projects/${projectSlug}/delete_project/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
    });

    if (response.ok) {
        //alert('Проект успешно удален!');
        window.location.href = '/manager/api_page/projects/';
    } else {
        alert('Ошибка удаления проекта');
    }
});

cancelDeleteButton.addEventListener('click', () => {
    deleteModal.style.display = 'none';
});

// Редактирование проекта
const editTaskButton = document.getElementById('edit-task-button');
editTaskButton.addEventListener('click', () => {
    // document.getElementById('task-modal-content-p').style.display = 'none';
    // document.getElementById('task-modal-deadline-p').style.display = 'none';
    const taskDescriptionInput = document.getElementById('edit-task-content');
    const taskDeadlineDateInput = document.getElementById('edit-task-deadline-date');
    const taskDeadlineTimeInput = document.getElementById('edit-task-deadline-time');
    const deadline = document.getElementById('task-modal-deadline').textContent;
    console.log(deadline);
    // Заполнение полей для редактирования
    taskDescriptionInput.value = document.getElementById('task-modal-content').textContent;
    



    // Разбиваем строку на дату и время
    const [datePart, timePart] = deadline.split(", ");

    // Разбиваем дату на компоненты (день, месяц, год)
    const [day, month, year] = datePart.split(".");

    // Формируем строку в формате ISO 8601
    const isoDateString = `${year}-${month}-${day}T${timePart}`;

    // Преобразуем в объект Date
    const dateObject = new Date(isoDateString);

    // Проверяем результат
    if (!isNaN(dateObject.getTime())) {
        console.log("Преобразование прошло успешно:", dateObject);
    } else {
        console.error("Некорректная строка даты:", dateString);
    }



    // Проверка на наличие дедлайна
    
    const isoDate = dateObject;
    console.log(isoDate);
    taskDeadlineDateInput.value = isoDate;//.split(' ')[0]; // Дата в формате yyyy-MM-dd
    // taskDeadlineTimeInput.value = isoDate.split(' ')[1].slice(0, 5); // Время в формате HH:mm
    

    document.getElementById('task-edit-modal').style.display = 'flex';
});

saveButton.addEventListener('click', async () => {
    const projectSlug = window.location.pathname.split('/')[window.location.pathname.split('/').length - 3];
    console.log(window.location.pathname.split('/'));
    const newName = newProjectNameInput.value.trim();
    console.log("{{ csrf_token }}")
    if (newName) {
        const response = await fetch(`/manager/api/projects/${projectSlug}/update_project/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ name: newName, slug: projectSlug}),
        });

        if (response.ok) {
            //alert('Название успешно изменено!');
            const data = await response.json();
            window.location.href = `/manager/api_page/${data.slug}/tasks/`;
            
            //document.getElementById('project-name').textContent = `Проект: ${data.name}`;
            //document.title = `Проект: ${data.name}`;

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