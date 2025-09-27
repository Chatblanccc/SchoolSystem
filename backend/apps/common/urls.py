from django.urls import path
from .views import me, change_password, academic_settings

urlpatterns = [
    path('auth/me/', me),
    path('auth/change-password/', change_password),
    path('system/academic-settings/', academic_settings),
]


