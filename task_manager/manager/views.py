from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Project, Status, Task
from .serializers import TaskSerializer, ProjectSerializer, StatusSerializer


class StatusViewSet(ModelViewSet):
    """
    ViewSet для управления статусами.
    """
    queryset = Status.objects.all()
    serializer_class = StatusSerializer


class ProjectViewSet(ModelViewSet):
    """
    ViewSet для управления проектами.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    lookup_field = 'slug'  # Используем slug вместо id для поиска

    @action(detail=False, methods=['post'], url_path='add')
    def add_project(self, request):
        """
        Добавить проект.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def update_project(self, request, slug=None):
        """
        Кастомное обновление проекта по slug.
        """
        project = get_object_or_404(Project, slug=slug)
        serializer = self.get_serializer(instance=project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def delete_project(self, request, slug=None):
        """
        Удалить проект.
        """
        project = get_object_or_404(Project, slug=slug)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskViewSet(ModelViewSet):
    """
    ViewSet для управления задачами.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    lookup_fields = 'id'  # Используем id для поиска задач

    @action(detail=False, methods=['post'], url_path='add_task')
    def add_task(self, request, project_slug=None):
        """
        Добавить задачу.
        """
        project_id = Project.objects.filter(slug=project_slug).first().id
        data = request.data
        data['project'] = project_id
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='details')
    def task_details(self, request, pk=None):
        """
        Получить детальную информацию о задаче, включая название статуса.
        """
        task = get_object_or_404(Task, id=pk)
        status_instance = get_object_or_404(Status, id=task.status_id)
        return Response({
            **TaskSerializer(task).data,
            "status_name": StatusSerializer(status_instance).data["name"]
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='update_status')
    def update_task_status(self, request, pk=None):
        """
        Обновить статус задачи.
        """
        task = get_object_or_404(Task, id=pk)
        data = {
            "content": task.content,
            "deadline": task.deadline,
            "status": request.data.get("status_id"),
            "name": task.name
        }
        serializer = self.get_serializer(instance=task, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], url_path='update')
    def update_task(self, request, pk=None):
        """
        Обновить дедлайн и контент задачи.
        """
        task = get_object_or_404(Task, id=pk)
        data = {
            "content": request.data.get("content"),
            "deadline": request.data.get("deadline"),
            "status": task.status_id,
            "name": task.name
        }
        serializer = self.get_serializer(instance=task, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def delete_task(self, request, pk=None):
        """
        Удалить задачу.
        """
        task = get_object_or_404(Task, id=pk)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='grouped-by-status')
    def grouped_by_status(self, request):
        project_slug = request.query_params.get('project_slug')
        project = Project.objects.filter(slug=project_slug).first()
        if not project:
            return Response({"error": "Project not found"}, status=404)

        statuses = Status.objects.all()
        tasks_by_status = [
            {
                'status': status.name,
                'id': status.id,
                'tasks': TaskSerializer(
                    Task.objects.filter(project=project, status=status),
                    many=True,
                    context={'request': request}  # Передаём объект request
                ).data
            }
            for status in statuses
        ]
        return Response({
            'project': {'id': project.id, 'name': project.name, 'slug': project.slug},
            'tasks_by_status': tasks_by_status
        })


# Рендеры для API
from django.shortcuts import render

def api_page_projects_list(request):
    return render(request, 'manager_api/api_project_list.html')

def api_page_project_tasks(request, project_slug):
    return render(request, 'manager_api/api_project_tasks.html')