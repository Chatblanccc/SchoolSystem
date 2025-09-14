import django_filters
from apps.students.models import Student


class StudentFilter(django_filters.FilterSet):
    class_id = django_filters.UUIDFilter(field_name="current_class_id")
    grade_id = django_filters.UUIDFilter(field_name="current_class__grade_id")
    gender = django_filters.CharFilter(field_name="gender")
    status = django_filters.CharFilter(field_name="status")
    # 特殊筛选器：是否包含已转出学生
    include_transferred = django_filters.BooleanFilter(method="filter_include_transferred")
    created_at_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_at_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    def filter_include_transferred(self, queryset, name, value):
        # 如果不包含已转出学生（默认），则排除转学状态
        if not value:
            return queryset.exclude(status="转学")
        return queryset

    class Meta:
        model = Student
        fields = ["class_id", "grade_id", "gender", "status"]


