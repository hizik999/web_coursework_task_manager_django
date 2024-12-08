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
    project_id = ProjectSerializer()  # Вложенный сериализатор
    status_id = StatusSerializer()

    class Meta:
        model = Task
        fields = '__all__'