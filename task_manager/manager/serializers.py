from rest_framework import serializers
from manager.models import Project, Status, Task

class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    links = serializers.SerializerMethodField()  # Поле для HATEOAS ссылок

    class Meta:
        model = Project
        fields = ['id', 'name', 'slug', 'links']

    def get_links(self, obj):
        request = self.context.get('request')  # Достаём текущий запрос из контекста
        return {
            'self': request.build_absolute_uri(f'/api/projects/{obj.slug}/'),
            'tasks': request.build_absolute_uri(f'/api/projects/{obj.slug}/tasks/')
        }


class TaskSerializer(serializers.ModelSerializer):
    status = serializers.PrimaryKeyRelatedField(
        queryset=Status.objects.all()
    )
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        required=False,
        write_only=True
    )
    links = serializers.SerializerMethodField()  # Поле для HATEOAS ссылок

    class Meta:
        model = Task
        fields = ['id', 'name', 'slug', 'content', 'status', 'project', 'deadline', 'links']
        extra_kwargs = {
            'slug': {'read_only': True},
        }

    def get_links(self, obj):
        request = self.context.get('request')  # Достаём текущий запрос из контекста
        return {
            'self': request.build_absolute_uri(f'/api/tasks/{obj.id}/'),
            'update_status': request.build_absolute_uri(f'/api/tasks/{obj.id}/update-status/'),
            'project': request.build_absolute_uri(f'/api/projects/{obj.project.slug}/') if obj.project else None
        }