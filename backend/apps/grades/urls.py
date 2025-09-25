from rest_framework.routers import DefaultRouter

from .views import ExamViewSet, ScoreViewSet


router = DefaultRouter()
router.register(r"exams", ExamViewSet, basename="exam")
router.register(r"scores", ScoreViewSet, basename="score")

urlpatterns = router.urls


