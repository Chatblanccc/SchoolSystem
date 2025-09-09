import django_filters
from django.db.models import Q

from .models import Teacher


class TeacherFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Teacher
        fields = ["employment_status", "employment_type"]

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(name__icontains=value)
            | Q(teacher_id__icontains=value)
            | Q(phone__icontains=value)
        )


