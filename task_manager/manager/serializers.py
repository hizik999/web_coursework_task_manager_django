from rest_framework import serializers
from manager.models import Project, Status, Task

class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    status = serializers.PrimaryKeyRelatedField(
        queryset=Status.objects.all()
    )
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Task
        fields = ['id', 'name', 'slug', 'content', 'status', 'project', 'deadline']
        extra_kwargs = {
            'slug': {'read_only': True},
        }