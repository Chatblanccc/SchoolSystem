from django.urls import path
from .views import me, change_password

urlpatterns = [
    path('auth/me/', me),
    path('auth/change-password/', change_password),
]


