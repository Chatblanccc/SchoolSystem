from rest_framework import serializers
from .models import Course
from apps.teachers.models import TeachingAssignment, Teacher
from apps.schools.models import Class as SchoolClass


class CourseListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "code",
            "name",
            "category",
            "weekly_hours",
            "status",
            "teacher_name",
            "class_name",
            "created_at",
            "updated_at",
        ]

    def get_teacher_name(self, obj: Course):
        assignment = (
            obj.teaching_assignments.select_related("teacher", "class_ref").first()
            if hasattr(obj, "teaching_assignments")
            else None
        )
        return assignment.teacher.name if assignment and assignment.teacher else None

    def get_class_name(self, obj: Course):
        assignment = (
            obj.teaching_assignments.select_related("teacher", "class_ref").first()
            if hasattr(obj, "teaching_assignments")
            else None
        )
        return assignment.class_ref.name if assignment and assignment.class_ref else None


class CourseDetailSerializer(serializers.ModelSerializer):
    code_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # 兼容前端表单：创建/更新时可直接提交 teacher_id / class_id
    teacher_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    class_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    # 名称兜底：若未提供ID，则允许通过名称匹配
    teacher_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    class_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    teacher_name = serializers.SerializerMethodField(read_only=True)
    class_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "code",
            "code_input",
            "name",
            "category",
            "weekly_hours",
            "description",
            "status",
            # 写入字段
            "teacher_id",
            "class_id",
            "teacher_name_input",
            "class_name_input",
            # 只读展示字段
            "teacher_name",
            "class_name",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by", "updated_by"]

    def create(self, validated_data):
        code_input = validated_data.pop("code_input", None)
        teacher_id = validated_data.pop("teacher_id", None)
        class_id = validated_data.pop("class_id", None)
        teacher_name_input = validated_data.pop("teacher_name_input", "").strip()
        class_name_input = validated_data.pop("class_name_input", "").strip()
        if code_input:
            validated_data["code"] = code_input
        course = super().create(validated_data)
        # 若提供了 teacher_id 与 class_id，则创建一条任课关联
        if (teacher_id or teacher_name_input) and (class_id or class_name_input):
            teacher = (
                Teacher.objects.filter(pk=teacher_id).first()
                if teacher_id
                else Teacher.objects.filter(name=teacher_name_input).first()
            )
            class_obj = (
                SchoolClass.objects.filter(pk=class_id).first()
                if class_id
                else SchoolClass.objects.filter(name=class_name_input).first()
            )
            if teacher and class_obj:
                TeachingAssignment.objects.create(
                    course=course,
                    teacher=teacher,
                    class_ref=class_obj,
                    subject=course.name,
                    weekly_hours=course.weekly_hours,
                    duty="任课",
                )
        return course

    def update(self, instance, validated_data):
        code_input = validated_data.pop("code_input", None)
        teacher_id = validated_data.pop("teacher_id", None)
        class_id = validated_data.pop("class_id", None)
        teacher_name_input = validated_data.pop("teacher_name_input", "").strip()
        class_name_input = validated_data.pop("class_name_input", "").strip()
        if code_input:
            validated_data["code"] = code_input
        course = super().update(instance, validated_data)
        if teacher_id or class_id or teacher_name_input or class_name_input:
            assignment = course.teaching_assignments.first()
            teacher = (
                Teacher.objects.filter(pk=teacher_id).first() if teacher_id else (
                    Teacher.objects.filter(name=teacher_name_input).first() if teacher_name_input else None
                )
            )
            class_obj = (
                SchoolClass.objects.filter(pk=class_id).first() if class_id else (
                    SchoolClass.objects.filter(name=class_name_input).first() if class_name_input else None
                )
            )
            if assignment:
                if teacher:
                    assignment.teacher = teacher
                if class_obj:
                    assignment.class_ref = class_obj
                assignment.subject = course.name
                assignment.weekly_hours = course.weekly_hours
                assignment.save(update_fields=["teacher", "class_ref", "subject", "weekly_hours", "updated_at"])
            elif teacher and class_obj:
                TeachingAssignment.objects.create(
                    course=course,
                    teacher=teacher,
                    class_ref=class_obj,
                    subject=course.name,
                    weekly_hours=course.weekly_hours,
                    duty="任课",
                )
        return course

    def get_teacher_name(self, obj: Course):
        assignment = obj.teaching_assignments.select_related("teacher", "class_ref").first()
        return assignment.teacher.name if assignment and assignment.teacher else None

    def get_class_name(self, obj: Course):
        assignment = obj.teaching_assignments.select_related("teacher", "class_ref").first()
        return assignment.class_ref.name if assignment and assignment.class_ref else None


