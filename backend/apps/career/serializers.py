from rest_framework import serializers
from .models import CareerProfile, TargetRole

class CareerProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = CareerProfile
        fields = [
            'id', 'user_email', 'current_role', 'years_of_experience',
            'current_ctc', 'expected_ctc_min', 'expected_ctc_max',
            'notice_period', 'preferred_locations', 'preferred_work_modes',
            'career_goal', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_email', 'created_at', 'updated_at']


class TargetRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TargetRole
        fields = ['id', 'name', 'priority', 'is_primary', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        is_primary = validated_data.get('is_primary', False)
        
        if is_primary:
            TargetRole.objects.filter(user=user, is_primary=True).update(is_primary=False)
            
        return TargetRole.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user = instance.user
        is_primary = validated_data.get('is_primary', instance.is_primary)
        
        if is_primary and not instance.is_primary:
            TargetRole.objects.filter(user=user, is_primary=True).update(is_primary=False)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
