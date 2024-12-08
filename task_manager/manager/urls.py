from django.urls import path
from . import views

urlpatterns = [
    path('projects/', views.project_list, name='project_list'),
    path('projects/<slug:slug>/', views.project_tasks, name='project_tasks'),
]