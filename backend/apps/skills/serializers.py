from rest_framework import serializers
from .models import Skill, SkillAlias, SkillCategory, SkillProficiency, SkillSource
from .normalizer import normalize_skill_name, infer_skill_category

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'proficiency', 'source', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Skill name cannot be empty.")
        # Normalize skill name
        return normalize_skill_name(value)

    def create(self, validated_data):
        user = self.context['request'].user
        name = validated_data['name']
        category = validated_data.get('category', SkillCategory.OTHER)

        # If category is 'other', attempt to infer category
        if category == SkillCategory.OTHER:
            inferred = infer_skill_category(name)
            if inferred != SkillCategory.OTHER:
                validated_data['category'] = inferred

        # Check if skill already exists for this user
        existing = Skill.objects.filter(user=user, name__iexact=name).first()
        if existing:
            # Update proficiency if higher/specified
            existing.proficiency = validated_data.get('proficiency', existing.proficiency)
            existing.category = validated_data.get('category', existing.category)
            existing.save()
            return existing

        return Skill.objects.create(user=user, **validated_data)


class NormalizeSkillSerializer(serializers.Serializer):
    skill = serializers.CharField(required=True)
