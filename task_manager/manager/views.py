from django.shortcuts import render, get_object_or_404
from .models import Project, Status, Task
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

### -----------------------------------API---------------------------------------------------------------------------------------------------------
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Task, Project, Status
from .serializers import TaskSerializer, ProjectSerializer, StatusSerializer

class ProjectListView(APIView):
    def get(self, request):
        projects = Project.objects.all()
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

class TaskListView(APIView):
    def get(self, request, project_slug):
        project = Project.objects.get(slug=project_slug)
        tasks = Task.objects.filter(project_id=project.id)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request, project_slug):
        project = Project.objects.get(slug=project_slug)
        data = request.data
        data['project'] = project.id
        serializer = TaskSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

### -----------------------------------Renders for API---------------------------------------------------------------------------------------------------------
def api_page_projects_list(request):
    return render(request, 'manager_api/api_project_list.html')

def api_page_project_tasks(request, project_slug):
    return render(request, 'manager_api/api_project_tasks.html')

### -----------------------------------Django---------------------------------------------------------------------------------------------------------
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