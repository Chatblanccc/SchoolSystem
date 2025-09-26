from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from django.http import HttpResponse

from apps.common.pagination import BYSSPagination
from .models import Course
from .serializers import CourseListSerializer, CourseDetailSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by("-created_at")
    pagination_class = BYSSPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name"]
    filterset_fields = ["status", "category", "code"]
    ordering_fields = ["created_at", "updated_at", "name", "code"]

    def get_serializer_class(self):
        if self.action in ["list"]:
            return CourseListSerializer
        return CourseDetailSerializer

    @action(detail=False, methods=["get"], url_path="export")
    def export_courses(self, request):
        qs = self.filter_queryset(self.get_queryset())
        rows = ["课程学段,课程名称,课程类型,周课时,分值,状态"]
        for c in qs:
            rows.append(f"{c.code},{c.name},{c.category},{c.weekly_hours},{c.full_score or ''},{c.status}")
        csv_content = "\n".join(rows)
        response = HttpResponse(csv_content, content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="courses.csv"'
        return response


