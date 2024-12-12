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
        return Response(serializer.data, status=status.HTTP_200_OK)

class ProjectListView(APIView):
    def get(self, request):
        projects = Project.objects.all()
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        serializer = ProjectSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, slug):
        project = get_object_or_404(Project, slug=slug)
        data = request.data
        serializer = ProjectSerializer(instance=project, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, slug):
        project = get_object_or_404(Project, slug=slug)
        project.delete()
        return Response(status=status.HTTP_200_OK)

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

### -----------------------------------Renders for API---------------------------------------------------------------------------------------------------------
def api_page_projects_list(request):
    return render(request, 'manager_api/api_project_list.html')

def api_page_project_tasks(request, project_slug):
    return render(request, 'manager_api/api_project_tasks.html')