from django.shortcuts import render
from .models import Project

def project_list(request):
    projects = Project.objects.all()  # Получение всех проектов
    return render(request, 'manager/project_list.html', {'projects': projects})