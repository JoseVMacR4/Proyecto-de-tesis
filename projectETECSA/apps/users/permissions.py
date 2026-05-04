from apps.users.models import UserRole


def get_user_role(user):
    if not user.is_authenticated:
        return None
    user_role = UserRole.objects.select_related('role').filter(user=user).first()
    return user_role.role if user_role else None


def can_access_admin(user):
    role = get_user_role(user)
    return role.can_access_admin if role else False


def can_upload_statements(user):
    role = get_user_role(user)
    return role.can_upload_statements if role else False


def can_reconcile(user):
    role = get_user_role(user)
    return role.can_reconcile if role else False


def can_view_all(user):
    role = get_user_role(user)
    return role.can_view_all if role else False


def get_user_permissions(user):
    role = get_user_role(user)
    if not role:
        return {
            'can_access_admin': False,
            'can_upload_statements': False,
            'can_reconcile': False,
            'can_view_all': False,
            'role_name': None,
        }
    return {
        'can_access_admin': role.can_access_admin,
        'can_upload_statements': role.can_upload_statements,
        'can_reconcile': role.can_reconcile,
        'can_view_all': role.can_view_all,
        'role_name': role.name,
    }