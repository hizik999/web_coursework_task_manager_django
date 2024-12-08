# web_coursework_task_manager_django
Репозиторий с курсовой работой по предмету "Веб программирование" с использованием Django Framework на тему "Создание RESTful API с использованием Django Rest Framework: принципы проектирования и реализации" на примере приложения для управления задачами

initial commit

### что я сделал
1. Сделал Dockerfile с образом Django (а также requirements.txt)
2. Создал проект Django (лежит в папке task_manager)
3. Сделал docker-compose.yml с конфигом образа Django и добавил туда PostgreSQL, предварительно сконфигурировав database в settings.url
4. Добавил модели данных и провел миграцию
5. Сделал первую страницу manager/projects, которая отображает все добавленные проекты