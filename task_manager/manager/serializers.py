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
    status = StatusSerializer(source='status_id', read_only=True)
    project = ProjectSerializer(source='project_id', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'