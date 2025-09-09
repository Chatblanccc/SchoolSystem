from django.contrib import admin

from apps.students.models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("student_id", "name", "gender", "current_class", "status", "created_at")
    search_fields = ("student_id", "name")
    list_filter = ("gender", "status")


