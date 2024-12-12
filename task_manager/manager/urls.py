from django.urls import path
from . import views

urlpatterns = [
    ### ---------------------------API------------------------------------------------------------------------------------------------
    ### GET вывод всех статусов
    path('api/statuses/', views.StatusListView.as_view(), name="api_statuses"),

    ### GET вывод всех проектов
    path('api/projects/', views.ProjectListView.as_view(), name="api_projects"),
    ### POST создание проекта
    path('api/projects/add/', views.ProjectListView.as_view(), name="api_projects_add"),
    ### PATCH редактирование проекта
    path('api/projects/<slug:slug>/edit/', views.ProjectListView.as_view(), name="api_projects_edit"),
    ### DELETE удаление проекта
    path('api/projects/<slug:slug>/delete/', views.ProjectListView.as_view(), name="api_projects_delete"),
    
    ### GET вывод всех задач
    path('api/projects/<slug:slug>/tasks/', views.TaskListView.as_view(), name="api_project_tasks"),
    ### POST создание задачи
    path('api/projects/<slug:slug>/tasks/add/', views.TaskListView.as_view(), name="api_project_tasks_add"),

    ### GET вывод конкретной задачи
    path('api/tasks/<slug:slug>/', views.TaskDetailsView.as_view(), name="api_tasks_details"),
    ### PATCH редактирование конкретной задачи
    path('api/tasks/<int:task_id>/update/', views.TaskDetailsView.as_view(), name="api_tasks_update"),
    ### DELETE удаление конкретной задачи
    path('api/tasks/<int:task_id>/delete/', views.TaskDetailsView.as_view(), name="api_tasks_delete"),

    ### ---------------------------API pages------------------------------------------------------------------------------------------------
    path('api_page/projects/', views.api_page_projects_list, name="api_page_projects_list"),
    path('api_page/<slug:project_slug>/tasks/', views.api_page_project_tasks, name="api_page_project_tasks")
]