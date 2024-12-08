from django.urls import path
from . import views

urlpatterns = [
    ### ---------------------------Vanilla Django------------------------------------------------------------------------------------------------
    path('projects/', views.project_list, name='project_list'),
    path('projects/<slug:slug>/', views.project_tasks, name='project_tasks'),
    path('tasks/<int:task_id>/update-status/', views.update_task_status, name='update_task_status'),
    ### ---------------------------API------------------------------------------------------------------------------------------------
    path('api/<slug:project_slug>/tasks/', views.TaskListView.as_view(), name="api_project_tasks"),
    path('api/projects/', views.ProjectListView.as_view(), name="api_projects"),
    path('api_page/projects/', views.api_page_projects_list, name="api_page"),
]