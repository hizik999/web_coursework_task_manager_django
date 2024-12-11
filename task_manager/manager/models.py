from django.db import models
from django.utils.text import slugify
import unidecode
# Create your models here.
    
class Status(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'statuses'
        verbose_name = 'Status' 
        verbose_name_plural = 'Statuses'


    def __str__(self):
        return self.name
    
class Project(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=50, unique=True, blank=True)

    class Meta:
        db_table = 'projects'

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Генерация слага из названия, если слаг пустой
        if not self.slug and self.name:
            slug1 = unidecode.unidecode(self.name)
            base_slug = slugify(slug1)
            slug = base_slug
            counter = 1

            # Генерируем уникальный slug
            while Task.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        elif not self.name:
            raise ValueError("Project name cannot be empty for slug generation.")  # Обработка случая, когда name пустое
        
        super().save(*args, **kwargs)

    
class Task(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    content = models.TextField()
    status = models.ForeignKey('Status', on_delete=models.PROTECT, related_name='tasks')
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='tasks')
    deadline = models.DateTimeField()

    class Meta:
        db_table = 'tasks'

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Проверяем, что slug пустой и есть имя для генерации
        if not self.slug and self.name:
            slug1 = unidecode.unidecode(self.name)
            base_slug = slugify(slug1)
            slug = base_slug
            counter = 1

            # Генерируем уникальный slug
            while Task.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        elif not self.name:
            raise ValueError("Task name cannot be empty for slug generation.")  # Обработка случая, когда name пустое

        super().save(*args, **kwargs)