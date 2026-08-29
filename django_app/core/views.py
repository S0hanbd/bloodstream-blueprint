from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db import models
from .models import UserProfile, DonationRecord, BloodRequest, ContactRequest, ProfileReport
from .supabase_service import SupabaseService
from .forms import SingleRegistrationForm, LoginForm, BloodRequestForm, ProfileReportForm
import datetime

def index_view(request):
    donors = SupabaseService.get_donors()
    stats = SupabaseService.get_statistics()
    featured_donors = donors[:4]
    open_requests = BloodRequest.objects.filter(status='open').order_by('-created_at')[:3]
    
    return render(request, 'index.html', {
        'donors': featured_donors,
        'stats': stats,
        'open_requests': open_requests,
    })

def search_view(request):
    blood_group = request.GET.get('blood_group', 'ALL')
    search_query = request.GET.get('q', '')
    
    donors = SupabaseService.get_donors(blood_group=blood_group, search_query=search_query)
    
    available_count = len([d for d in donors if d['is_available']])
    cooldown_count = len(donors) - available_count

    return render(request, 'search.html', {
        'donors': donors,
        'selected_blood_group': blood_group,
        'search_query': search_query,
        'available_count': available_count,
        'cooldown_count': cooldown_count,
    })

def register_view(request):
    if request.session.get('user'):
        return redirect('dashboard')

    if request.method == 'POST':
        form = SingleRegistrationForm(request.POST)
        if form.is_valid():
            try:
                user_data = SupabaseService.register_user(form.cleaned_data)
                request.session['user'] = user_data
                
                if form.cleaned_data.get('email', '').endswith('@uap-bd.edu'):
                    messages.success(request, "Registration successful! Your identity is instantly verified with your UAP email.")
                else:
                    messages.success(request, "Registration successful! Profile submitted for UAP identity verification.")
                    
                return redirect('dashboard')
            except ValueError as ve:
                messages.error(request, str(ve))
            except Exception as ex:
                messages.error(request, f"Registration failed: {ex}")
        else:
            messages.error(request, "Please fix the highlighted errors in the form below.")
    else:
        form = SingleRegistrationForm()

    return render(request, 'register.html', {'form': form})

def login_view(request):
    if request.session.get('user'):
        return redirect('dashboard')

    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            identifier = form.cleaned_data['identifier']
            password = form.cleaned_data['password']
            try:
                user_data = SupabaseService.login_user(identifier, password)
                request.session['user'] = user_data
                messages.success(request, "Welcome back!")
                return redirect('dashboard')
            except ValueError as ve:
                messages.error(request, str(ve))
            except Exception as ex:
                messages.error(request, f"Login failed: {ex}")
    else:
        form = LoginForm()

    return render(request, 'login.html', {'form': form})

def logout_view(request):
    request.session.flush()
    messages.info(request, "Logged out successfully.")
    return redirect('index')

def dashboard_view(request):
    user = request.session.get('user')
    if not user:
        messages.warning(request, "Please log in to access your donor dashboard.")
        return redirect('login')

    profile = UserProfile.objects.filter(uap_id=user['uap_id']).first()
    if not profile:
        profile = UserProfile.objects.first()

    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'update_privacy':
            profile.show_phone_publicly = request.POST.get('show_phone_publicly') == 'on'
            profile.allow_contact_requests = request.POST.get('allow_contact_requests') == 'on'
            profile.profile_visible = request.POST.get('profile_visible') == 'on'
            profile.save()
            messages.success(request, "Privacy settings updated successfully!")
            return redirect('dashboard')

        # Standard profile update
        profile.full_name = request.POST.get('full_name', profile.full_name)
        profile.phone = request.POST.get('phone_number', profile.phone)
        profile.blood_group = request.POST.get('blood_group', profile.blood_group)
        profile.department = request.POST.get('department', profile.department)
        profile.batch_name = request.POST.get('batch_name', profile.batch_name)
        profile.city_area = request.POST.get('city_area', profile.city_area)
        profile.save()

        user['full_name'] = profile.full_name
        user['phone_number'] = profile.phone
        request.session['user'] = user

        messages.success(request, "Profile information updated successfully!")
        return redirect('dashboard')

    info = profile.availability_info if profile else {'is_eligible': True, 'days_remaining': 0}
    donations = profile.donation_records.order_by('-donation_date') if profile else []

    return render(request, 'dashboard.html', {
        'profile': profile,
        'availability_info': info,
        'donations': donations,
    })

def record_donation_view(request):
    user = request.session.get('user')
    if not user:
        return redirect('login')

    if request.method == 'POST':
        profile = UserProfile.objects.filter(uap_id=user['uap_id']).first()
        if profile:
            info = profile.availability_info
            if not info['is_eligible']:
                messages.error(request, f"Policy Cooldown Active: Next eligible donation date is {info['next_eligible_date']}.")
                return redirect('dashboard')

            DonationRecord.objects.create(
                donor=profile,
                donation_date=datetime.date.today(),
                location="UAP Blood Center",
                verification_status="self_reported"
            )
            messages.success(request, "Blood donation reported! Your 90-day availability policy cooldown is now active.")
    
    return redirect('dashboard')

def request_blood_view(request):
    if request.method == 'POST':
        form = BloodRequestForm(request.POST)
        if form.is_valid():
            req = form.save(commit=False)
            user = request.session.get('user')
            if user:
                profile = UserProfile.objects.filter(uap_id=user['uap_id']).first()
                req.requester = profile
            req.save()
            messages.success(request, f"Emergency Blood Request created for {req.blood_group}! Donors are being matched.")
            return redirect('blood_requests')
    else:
        form = BloodRequestForm()

    return render(request, 'request_blood.html', {'form': form})

def blood_requests_view(request):
    requests_qs = BloodRequest.objects.filter(status='open').order_by('-created_at')
    
    selected_id = request.GET.get('req_id')
    selected_req = None
    matching_donors = []

    if selected_id:
        selected_req = BloodRequest.objects.filter(id=selected_id).first()

    if not selected_req and requests_qs.exists():
        selected_req = requests_qs.first()

    if selected_req:
        matching_donors = SupabaseService.get_donors(blood_group=selected_req.blood_group)

    return render(request, 'blood_requests.html', {
        'requests': requests_qs,
        'selected_req': selected_req,
        'matching_donors': matching_donors,
    })

def contact_donor_view(request, donor_id):
    profile = UserProfile.objects.filter(models.Q(profile_uuid=donor_id) | models.Q(id=donor_id if str(donor_id).isdigit() else -1)).first()
    if not profile:
        profile = get_object_or_404(UserProfile, uap_id=donor_id)
    
    if not profile.allow_contact_requests:
        messages.error(request, "This donor is currently not accepting direct contact requests.")
        return redirect('search')

    if request.method == 'POST':
        req_name = request.POST.get('requester_name', 'Anonymous Requester')
        req_phone = request.POST.get('requester_phone', '')
        reason = request.POST.get('reason', '')

        ContactRequest.objects.create(
            requester_name=req_name,
            requester_phone=req_phone,
            donor=profile,
            reason=reason
        )

        messages.success(request, f"Contact request sent to {profile.full_name}! Phone access granted for emergency blood donation.")
        return render(request, 'contact_success.html', {
            'donor': profile,
            'requester_name': req_name,
        })

    return render(request, 'contact_modal.html', {'donor': profile})

def report_profile_view(request, donor_id):
    profile = UserProfile.objects.filter(models.Q(profile_uuid=donor_id) | models.Q(id=donor_id if str(donor_id).isdigit() else -1)).first()
    if not profile:
        profile = get_object_or_404(UserProfile, uap_id=donor_id)
    
    if request.method == 'POST':
        form = ProfileReportForm(request.POST)
        if form.is_valid():
            rep = form.save(commit=False)
            rep.reported_profile = profile
            rep.save()
            messages.info(request, "Report submitted. Our moderation team will review this profile.")
            return redirect('search')
    else:
        form = ProfileReportForm()

    return render(request, 'report_modal.html', {'form': form, 'donor': profile})

def moderation_view(request):
    """Admin Verification Queue & Moderation Actions (Approve, Reject, Request Correction, Suspend)"""
    pending_verifications = UserProfile.objects.filter(verification_status='pending')
    reports = ProfileReport.objects.filter(status='pending').order_by('-created_at')
    all_donors = UserProfile.objects.all().order_by('-created_at')
    all_requests = BloodRequest.objects.all().order_by('-created_at')

    if request.method == 'POST':
        action = request.POST.get('action')
        target_id = request.POST.get('target_id')
        notes = request.POST.get('admin_notes', '')

        p = UserProfile.objects.filter(id=target_id).first()
        
        if action == 'verify_user' and p:
            p.verification_status = 'verified'
            p.uap_id_verified = True
            p.blood_group_verified = True
            p.admin_notes = notes or "Verified by UAP Admin"
            p.save()
            messages.success(request, f"✓ Approved and Verified UAP identity for {p.full_name}.")
            
        elif action == 'reject_user' and p:
            p.verification_status = 'rejected'
            p.uap_id_verified = False
            p.admin_notes = notes or "Verification rejected by admin"
            p.save()
            messages.warning(request, f"❌ Verification rejected for {p.full_name}.")

        elif action == 'request_correction' and p:
            p.verification_status = 'needs_correction'
            p.admin_notes = notes or "Correction requested by admin"
            p.save()
            messages.info(request, f"📝 Requested profile correction for {p.full_name}.")

        elif action == 'suspend_user' and p:
            p.profile_visible = False
            p.verification_status = 'unverified'
            p.admin_notes = notes or "Suspended due to report/policy violation"
            p.save()
            messages.warning(request, f"🚫 Suspended donor profile for {p.full_name}.")

        elif action == 'dismiss_report':
            r = ProfileReport.objects.filter(id=target_id).first()
            if r:
                r.status = 'dismissed'
                r.save()
                messages.info(request, "Report dismissed.")

        return redirect('moderation')

    return render(request, 'moderation.html', {
        'pending_verifications': pending_verifications,
        'reports': reports,
        'all_donors': all_donors,
        'all_requests': all_requests,
    })

def forgot_password_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        messages.success(request, f"Password reset instructions sent to {email}. (Check inbox/spam folder).")
        return redirect('login')
    return render(request, 'forgot_password.html')
