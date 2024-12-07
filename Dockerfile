FROM python:3.9
WORKDIR /task_manager/task_manager
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "localhost:8000"]