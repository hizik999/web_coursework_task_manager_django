from django.shortcuts import render, get_object_or_404
from .models import Project, Status, Task
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt


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

@csrf_exempt
def update_task_status(request, task_id):
    if request.method == 'POST':
        data = json.loads(request.body)
        status_id = data.get('status_id')
        try:
            task = Task.objects.get(id=task_id)
            task.status_id = Status.objects.get(id=status_id)
            task.save()
            return JsonResponse({'message': 'Статус задачи обновлён'}, status=200)
        except Task.DoesNotExist:
            return JsonResponse({'error': 'Задача не найдена'}, status=404)
    return JsonResponse({'error': 'Неверный метод'}, status=405)