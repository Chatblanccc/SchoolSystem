from django.contrib import admin

from .models import Grade, Class


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "grade", "head_teacher_name", "capacity", "status", "created_at")
    search_fields = ("code", "name", "head_teacher_name")
    list_filter = ("status", "grade")


