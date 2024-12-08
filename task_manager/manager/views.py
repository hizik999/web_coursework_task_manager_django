from django.shortcuts import render, get_object_or_404
from .models import Project, Status

def project_list(request):
    projects = Project.objects.all()  # Получение всех проектов
    return render(request, 'manager/project_list.html', {'projects': projects})

def project_tasks(request, slug):
    project = get_object_or_404(Project, slug=slug) # Получение проекта по slug
    statuses = Status.objects.all()
    tasks_by_status = [
        (status, project.tasks.filter(status_id=status.id))
        for status in statuses
    ]

    return render(request, 'manager/project_tasks.html', {
        'project': project,
        'tasks_by_status': tasks_by_status,
    })