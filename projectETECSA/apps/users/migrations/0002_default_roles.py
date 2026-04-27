from django.db import migrations


def create_default_roles(apps, schema_editor):
    Role = apps.get_model('users', 'Role')
    default_roles = [
        'Administrador',
        'Analista Económico',
        'Analista Comercial',
        'Analista Financiero',
    ]
    for role_name in default_roles:
        Role.objects.get_or_create(name=role_name)


def delete_default_roles(apps, schema_editor):
    Role = apps.get_model('users', 'Role')
    Role.objects.filter(name__in=[
        'Administrador',
        'Analista Económico',
        'Analista Comercial',
        'Analista Financiero',
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_roles, delete_default_roles),
    ]
