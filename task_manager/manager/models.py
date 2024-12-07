from django.db import models

# Create your models here.
    
class Status(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'statuses'

    def __str__(self):
        return self.name
    
class Project(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=50, unique=True)

    class Meta:
        db_table = 'projects'

    def __str__(self):
        return self.name
    
class Task(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    content = models.TextField()
    status_id = models.ForeignKey(Status, on_delete=models.PROTECT, related_name='tasks')
    project_id = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    deadline = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tasks'

    def __str__(self):
        return self.name