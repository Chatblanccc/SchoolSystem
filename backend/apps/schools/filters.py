import django_filters
from django.db import models

from .models import Class


class ClassFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    grade_id = django_filters.UUIDFilter(field_name="grade__id")
    grade = django_filters.CharFilter(field_name="grade__name", lookup_expr="exact")
    status = django_filters.CharFilter(field_name="status")
    head_teacher_id = django_filters.UUIDFilter(field_name="head_teacher__id")

    class Meta:
        model = Class
        fields = ["search", "grade_id", "grade", "status", "head_teacher_id"]

    def filter_search(self, queryset, name, value):  # noqa: ARG002
        if not value:
            return queryset
        return queryset.filter(
            models.Q(name__icontains=value)
            | models.Q(code__icontains=value)
            | models.Q(head_teacher_name__icontains=value)
        )


