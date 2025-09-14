from django.db import transaction
from rest_framework import serializers

from apps.changes.models import StudentChange
from apps.students.models import Student


class StudentChangeSerializer(serializers.ModelSerializer):
    studentId = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), source="student", write_only=True)
    studentName = serializers.CharField(source="student.name", read_only=True)

    class Meta:
        model = StudentChange
        fields = [
            "id",
            "studentId",
            "studentName",
            "type",
            "status",
            "effective_date",
            "reason",
            "attachments",
            "student_snapshot",
            "version",
            "idempotency_key",
            # details
            "target_school_name",
            "target_school_contact",
            "release_date",
            "handover_note",
            "leave_type",
            "leave_start_date",
            "leave_end_date",
            "reinstate_return_date",
            "placement_policy",
            "target_class_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "created_at", "updated_at", "version"]

    def validate(self, attrs):
        change_type = attrs.get("type")
        
        # 根据异动类型验证必填字段
        if change_type == StudentChange.ChangeType.LEAVE:
            if not attrs.get("leave_start_date"):
                raise serializers.ValidationError({"leave_start_date": "休学开始日期必填"})
            if not attrs.get("leave_end_date"):
                raise serializers.ValidationError({"leave_end_date": "休学结束日期必填"})
            if attrs.get("leave_start_date") and attrs.get("leave_end_date"):
                if attrs["leave_start_date"] >= attrs["leave_end_date"]:
                    raise serializers.ValidationError({"leave_end_date": "结束日期必须晚于开始日期"})
        
        elif change_type == StudentChange.ChangeType.TRANSFER_OUT:
            if not attrs.get("target_school_name"):
                raise serializers.ValidationError({"target_school_name": "目标学校必填"})
        
        elif change_type == StudentChange.ChangeType.REINSTATE:
            if not attrs.get("reinstate_return_date"):
                raise serializers.ValidationError({"reinstate_return_date": "复学日期必填"})
        
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        # 初始化快照
        student: Student = validated_data["student"]
        validated_data.setdefault(
            "student_snapshot",
            {
                "status": student.status,
                "current_class_id": str(student.current_class_id) if student.current_class_id else None,
                "name": student.name,
                "student_id": student.student_id,
            },
        )
        return super().create(validated_data)


class StudentChangeListSerializer(serializers.ModelSerializer):
    studentName = serializers.CharField(source="student.name", read_only=True)
    className = serializers.CharField(source="student.current_class.name", read_only=True)

    class Meta:
        model = StudentChange
        fields = [
            "id",
            "studentName",
            "className",
            "type",
            "status",
            "effective_date",
            "created_at",
        ]


