from django.urls import path, include
from rest_framework_nested.routers import DefaultRouter, NestedDefaultRouter
from .views import ProjectViewSet, TaskViewSet, StatusViewSet, api_page_projects_list, api_page_project_tasks

# Основной роутер
router = DefaultRouter()
router.register('projects', ProjectViewSet, basename='project')
router.register('statuses', StatusViewSet, basename='status')
router.register('tasks', TaskViewSet, basename='task')

# Вложенный роутер для задач в рамках проекта
projects_router = NestedDefaultRouter(router, 'projects', lookup='project')
projects_router.register('tasks', TaskViewSet, basename='project-tasks')

# Основные маршруты
urlpatterns = [
    # Автоматически сгенерированные маршруты от роутеров
    path('api/', include(router.urls)),
    path('api/', include(projects_router.urls)),

    # Страницы API
    path('api_page/projects/', api_page_projects_list, name="api_page_projects_list"),
    path('api_page/<slug:project_slug>/tasks/', api_page_project_tasks, name="api_page_project_tasks"),
]