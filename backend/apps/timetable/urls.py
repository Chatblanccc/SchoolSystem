from django.urls import path
from .views import (
    school_timetable,
    class_timetable,
    teacher_timetable,
    room_timetable,
    me_timetable,
    create_lesson,
    get_lesson,
    update_lesson,
    delete_lesson,
)

urlpatterns = [
    path('timetable/me/', me_timetable),
    path('timetable/school/', school_timetable),
    path('timetable/classes/<uuid:pk>/', class_timetable),
    path('timetable/teachers/<uuid:pk>/', teacher_timetable),
    path('timetable/rooms/<uuid:pk>/', room_timetable),
    path('timetable/lessons/', create_lesson),  # POST 创建课次
    path('timetable/lessons/<uuid:pk>/', get_lesson),     # GET 单条课次
    path('timetable/lessons/<uuid:pk>/update/', update_lesson),  # PATCH 更新课次
    path('timetable/lessons/<uuid:pk>/delete/', delete_lesson),  # DELETE 删除课次
]


