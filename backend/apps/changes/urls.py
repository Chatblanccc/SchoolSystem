from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.changes.views import StudentChangeViewSet


router = DefaultRouter()
router.register(r"changes", StudentChangeViewSet, basename="student-change")

urlpatterns = [
    path("", include(router.urls)),
]


