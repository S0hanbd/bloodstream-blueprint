from .supabase_service import SupabaseService

def supabase_context(request):
    current_user = request.session.get('user')
    stats = SupabaseService.get_statistics()
    return {
        'current_user': current_user,
        'stats': stats,
    }
