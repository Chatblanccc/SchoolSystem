from rest_framework import serializers

from apps.grades.models import Exam, Score
from apps.schools.models import Grade, Class
from apps.courses.models import Course
from apps.students.models import Student


class ExamListSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source="grade.name", read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id",
            "code",
            "name",
            "term",
            "grade_name",
            "exam_date",
            "created_at",
        ]


class ExamDetailSerializer(serializers.ModelSerializer):
    grade_id = serializers.PrimaryKeyRelatedField(queryset=Grade.objects.all(), source="grade", required=False, allow_null=True)
    grade_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Exam
        fields = [
            "id",
            "code",
            "name",
            "term",
            "grade_id",
            "grade_name_input",
            "exam_date",
            "remark",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        if not attrs.get("grade") and not (self.initial_data.get("grade_name_input") or "" ).strip():
            raise serializers.ValidationError({"grade": ["grade_id 或 grade_name_input 必填"]})
        return attrs

    def create(self, validated_data):
        # 移除写入辅助字段，避免传入 Model.create()
        validated_data.pop("grade_name_input", None)
        name_input = (self.initial_data.get("grade_name_input") or "").strip()
        if not validated_data.get("grade") and name_input:
            grade, _ = Grade.objects.get_or_create(name=name_input)
            validated_data["grade"] = grade
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # 移除写入辅助字段，避免传入 Model.update()
        validated_data.pop("grade_name_input", None)
        name_input = (self.initial_data.get("grade_name_input") or "").strip()
        if name_input:
            grade, _ = Grade.objects.get_or_create(name=name_input)
            validated_data["grade"] = grade
        return super().update(instance, validated_data)


class ScoreListSerializer(serializers.ModelSerializer):
    studentId = serializers.CharField(source="student.student_id", read_only=True)

    class Meta:
        model = Score
        fields = [
            "id",
            "studentId",
            "student_name",
            "class_name",
            "course_name",
            "score",
            "rank_in_class",
            "rank_in_grade",
            "passed",
        ]


class ScoreDetailSerializer(serializers.ModelSerializer):
    exam_id = serializers.PrimaryKeyRelatedField(queryset=Exam.objects.all(), source="exam")
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), source="student")
    course_id = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), source="course")
    class_id = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), source="class_ref")

    # 名称兜底写入
    student_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    class_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    course_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Score
        fields = [
            "id",
            "exam_id",
            "student_id",
            "course_id",
            "class_id",
            "score",
            "full_score",
            "rank_in_class",
            "rank_in_grade",
            "passed",
            "student_name",
            "class_name",
            "course_name",
            "student_name_input",
            "class_name_input",
            "course_name_input",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "student_name", "class_name", "course_name", "created_at", "updated_at"]

    def validate(self, attrs):
        score = attrs.get("score")
        full = attrs.get("full_score") or 100
        if score is not None and (score < 0 or (full is not None and score > full)):
            raise serializers.ValidationError({"score": ["分数必须在 0 到 满分 之间"]})
        return attrs

    def create(self, validated_data):
        # 冗余名称
        student = validated_data.get("student")
        class_ref = validated_data.get("class_ref")
        course = validated_data.get("course")
        validated_data["student_name"] = getattr(student, "name", "")
        validated_data["class_name"] = getattr(class_ref, "name", "")
        validated_data["course_name"] = getattr(course, "name", "")
        obj = super().create(validated_data)
        self._set_passed(obj)
        obj.save(update_fields=["passed"])
        return obj

    def update(self, instance, validated_data):
        obj = super().update(instance, validated_data)
        self._set_passed(obj)
        obj.save(update_fields=["passed"])
        return obj

    def _set_passed(self, obj: Score):
        full = obj.full_score or 100
        obj.passed = (obj.score or 0) >= max(60, full * 0.6)


