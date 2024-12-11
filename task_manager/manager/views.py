from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils.text import slugify

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


class StatusListView(APIView):
    def get(self, request):
        statuses = Status.objects.all()
        serializer = StatusSerializer(statuses, many=True)
        return Response(serializer.data)

class ProjectListView(APIView):
    def get(self, request):
        projects = Project.objects.all()
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        serializer = ProjectSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, slug):
        project = get_object_or_404(Project, slug=slug)
        data = {"name": request.data['name'], "slug": request.data['new_slug']}
        serializer = ProjectSerializer(instance=project, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, slug):
        project = get_object_or_404(Project, slug=slug)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class TaskDetailsView(APIView):
    def get(self, request, slug):
        task = get_object_or_404(Task, slug=slug)
        status = get_object_or_404(Status, id=task.status_id)
        return Response({
            **TaskSerializer(task).data,
            "status_name": StatusSerializer(status).data["name"]
        })    
    
    def patch(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        data = request.data
        data["status"] = task.status_id
        data["name"] = task.name
        serializer = TaskSerializer(instance=task, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        data = {}
        data["content"] = task.content
        data["deadline"] = task.deadline
        data["status"] = request.data["status_id"]
        data["name"] = task.name
        serializer = TaskSerializer(instance=task, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class TaskListView(APIView):
    def get(self, request, slug):
        # Получаем проект по slug
        project = get_object_or_404(Project, slug=slug)
        # Группируем задачи по статусам
        statuses = Status.objects.all()
        tasks_by_status = [
            {
                'status': status.name,
                'id': status.id,
                'tasks': TaskSerializer(
                    Task.objects.filter(project=project, status=status),
                    many=True
                ).data
            }
            for status in statuses
        ]
        return Response({
            'project': {'id': project.id, 'name': project.name, 'slug': project.slug},
            'tasks_by_status': tasks_by_status
        })

    def post(self, request, slug):
        project = get_object_or_404(Project, slug=slug)
        data = request.data
        data['project'] = project.id  # Присваиваем project ID напрямую
        serializer = TaskSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class UpdateTaskStatusView(APIView):
#     def post(self, request, task_id):
#         try:
#             # Получаем задачу по ID
#             task = Task.objects.get(id=task_id)
#         except Task.DoesNotExist:
#             return Response({'error': 'Задача не найдена'}, status=status.HTTP_404_NOT_FOUND)

#         # Получаем ID статуса из тела запроса
#         status_id = request.data.get('status_id')
#         if not status_id:
#             return Response({'error': 'Поле status_id обязательно'}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             # Получаем объект статуса
#             new_status = Status.objects.get(id=status_id)
#         except Status.DoesNotExist:
#             return Response({'error': 'Статус не найден'}, status=status.HTTP_404_NOT_FOUND)

#         # Обновляем статус задачи
#         task.status = new_status
#         task.save()

#         # Возвращаем обновлённую задачу
#         serializer = TaskSerializer(task)
#         return Response({'message': 'Статус задачи обновлён', 'task': serializer.data}, status=status.HTTP_200_OK)

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