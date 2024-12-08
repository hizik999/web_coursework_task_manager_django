from django.urls import path
from . import views

urlpatterns = [
    path('projects/', views.project_list, name='project_list'),
    path('projects/<slug:slug>/', views.project_tasks, name='project_tasks'),
    path('tasks/<int:task_id>/update-status/', views.update_task_status, name='update_task_status'),
]