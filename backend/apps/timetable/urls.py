from django.urls import path
from .views import TimetableImportView, school_timetable, class_timetable, teacher_timetable, room_timetable, timetable_template

urlpatterns = [
    path('timetable/import/', TimetableImportView.as_view()),
    path('timetable/school/', school_timetable),
    path('timetable/classes/<uuid:pk>/', class_timetable),
    path('timetable/teachers/<uuid:pk>/', teacher_timetable),
    path('timetable/rooms/<uuid:pk>/', room_timetable),
    path('timetable/template/', timetable_template),
]


