from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class UserListSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "name",
            "is_active",
            "is_staff",
            "date_joined",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["name"] = instance.get_full_name() or instance.username
        return data


class UserDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "name",
            "is_active",
            "is_staff",
            "password",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "date_joined", "last_login"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["name"] = instance.get_full_name() or instance.username
        return data

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance is None:
            if not attrs.get("username"):
                raise serializers.ValidationError({"username": ["必填"]})
            if not attrs.get("password"):
                raise serializers.ValidationError({"password": ["必填"]})
        if "name" in self.initial_data and "last_name" not in self.initial_data:
            attrs["last_name"] = ""
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
