from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_view, name='index'),
    path('search/', views.search_view, name='search'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('record-donation/', views.record_donation_view, name='record_donation'),
    
    # Blood Request & Emergency Matching Workflow
    path('request-blood/', views.request_blood_view, name='request_blood'),
    path('blood-requests/', views.blood_requests_view, name='blood_requests'),
    
    # Privacy & Abuse Protection Flow
    path('contact-donor/<str:donor_id>/', views.contact_donor_view, name='contact_donor'),
    path('report-profile/<str:donor_id>/', views.report_profile_view, name='report_profile'),
    
    # Administration & Moderation Portal
    path('moderation/', views.moderation_view, name='moderation'),
    
    # Authentication & Account Recovery
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
]
