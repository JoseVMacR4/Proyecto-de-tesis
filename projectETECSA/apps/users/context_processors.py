from apps.users.permissions import get_user_permissions


def user_permissions(request):
    if request.user.is_authenticated:
        return {
            'user_permissions': get_user_permissions(request.user)
        }
    return {
        'user_permissions': {
            'can_access_admin': False,
            'can_upload_statements': False,
            'can_reconcile': False,
            'can_view_all': False,
            'role_name': None,
        }
    }