from django.urls import path
from . import views

urlpatterns = [
    ### ---------------------------Vanilla Django------------------------------------------------------------------------------------------------
    path('projects/', views.project_list, name='project_list'),
    path('projects/<slug:slug>/', views.project_tasks, name='project_tasks'),
    path('tasks/<int:task_id>/update-status/', views.update_task_status, name='update_task_status'),
    ### ---------------------------API------------------------------------------------------------------------------------------------
    path('api/projects/', views.ProjectListView.as_view(), name="api_projects"),
    path('api/projects/add/', views.ProjectListView.as_view(), name="api_projects_add"),
    path('api/projects/<slug:slug>/tasks/', views.TaskListView.as_view(), name="api_project_tasks"),
    #path('api/tasks/<int:task_id>/update-status/', views.UpdateTaskStatusView.as_view(), name='update_task_status'),
    ### ---------------------------API pages------------------------------------------------------------------------------------------------
    path('api_page/projects/', views.api_page_projects_list, name="api_page_projects_list"),
    path('api_page/<slug:project_slug>/tasks/', views.api_page_project_tasks, name="api_page_project_tasks")
]