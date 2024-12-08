from django.contrib import admin
from .models import Status, Project, Task

# Регистрация моделей с базовыми настройками
@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')  # Отображаемые поля в списке
    search_fields = ('name',)  # Поля для поиска

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')  # Отображаемые поля в списке
    search_fields = ('name', 'slug')  # Поля для поиска
    ordering = ('name',)  # Сортировка по имени

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'status_id', 'project_id', 'deadline')  # Отображаемые поля
    search_fields = ('name', 'slug', 'content')  # Поля для поиска
    list_filter = ('status_id', 'project_id', 'deadline')  # Фильтры по полям
    ordering = ('deadline',)  # Сортировка по сроку выполнения