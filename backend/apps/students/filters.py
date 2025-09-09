import django_filters
from apps.students.models import Student


class StudentFilter(django_filters.FilterSet):
    class_id = django_filters.UUIDFilter(field_name="current_class_id")
    grade_id = django_filters.UUIDFilter(field_name="current_class__grade_id")
    gender = django_filters.CharFilter(field_name="gender")
    created_at_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_at_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Student
        fields = ["class_id", "grade_id", "gender"]


