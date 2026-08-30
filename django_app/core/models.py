from django.db import models
from django.contrib.auth.models import User
import uuid
from datetime import date, timedelta

BLOOD_GROUP_CHOICES = [
    ('A+', 'A+'),
    ('A-', 'A-'),
    ('B+', 'B+'),
    ('B-', 'B-'),
    ('AB+', 'AB+'),
    ('AB-', 'AB-'),
    ('O+', 'O+'),
    ('O-', 'O-'),
]

USER_TYPE_CHOICES = [
    ('student', 'UAP Student'),
    ('faculty', 'UAP Faculty'),
    ('staff', 'UAP Staff'),
]

SEX_CHOICES = [
    ('male', 'Male'),
    ('female', 'Female'),
    ('other', 'Other'),
]

VERIFICATION_CHOICES = [
    ('verified', 'Verified UAP Member'),
    ('pending', 'Pending Verification'),
    ('needs_correction', 'Needs Correction'),
    ('rejected', 'Verification Rejected'),
    ('unverified', 'Unverified'),
]

URGENCY_CHOICES = [
    ('critical', 'Critical (Within 2-4 Hours)'),
    ('urgent', 'Urgent (Within 24 Hours)'),
    ('standard', 'Standard (Scheduled)'),
]

REQUEST_STATUS_CHOICES = [
    ('open', 'Open / Searching'),
    ('matched', 'Donor Matched'),
    ('fulfilled', 'Fulfilled'),
    ('cancelled', 'Cancelled'),
]

REPORT_REASON_CHOICES = [
    ('wrong_contact', 'Wrong or Unreachable Contact'),
    ('wrong_blood_group', 'Incorrect Blood Group Listed'),
    ('fake_profile', 'Fake or Impersonated Profile'),
    ('no_longer_donor', 'No Longer Available / Retired Donor'),
    ('harassment', 'Inappropriate Behavior or Harassment'),
    ('other', 'Other Reason'),
]

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', null=True, blank=True)
    profile_uuid = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    uap_id = models.CharField(max_length=30, unique=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    
    # Eligibility & Personal Attributes (Private)
    date_of_birth = models.DateField(null=True, blank=True, verbose_name="Date of Birth *")
    biological_sex = models.CharField(max_length=10, choices=SEX_CHOICES, default='male', verbose_name="Biological sex for donor eligibility *")
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='student')
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='pending')
    
    # Field-Level Verification Tracking
    uap_id_verified = models.BooleanField(default=False)
    blood_group_verified = models.BooleanField(default=False)
    donation_history_verified = models.BooleanField(default=False)
    admin_notes = models.TextField(blank=True, null=True)
    
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES)
    department = models.CharField(max_length=100, default='General')
    batch_name = models.CharField(max_length=50, default='UAP')
    city_area = models.CharField(max_length=100, default='Dhaka')
    
    # Privacy Controls
    profile_visible = models.BooleanField(default=True, verbose_name="Profile visible in donor search")
    allow_contact_requests = models.BooleanField(default=True, verbose_name="Allow blood-contact requests")
    show_phone_publicly = models.BooleanField(default=True, verbose_name="Show phone number publicly")
    
    last_confirmed_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.blood_group}) - {self.uap_id}"

    @property
    def user_id(self):
        return str(self.profile_uuid)

    @property
    def calculated_age(self):
        if not self.date_of_birth:
            return 21 # Default fallback
        today = date.today()
        dob = self.date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    @property
    def is_verified(self):
        return self.verification_status == 'verified'

    @property
    def latest_donation_date(self):
        latest = self.donation_records.order_by('-donation_date').first()
        return latest.donation_date if latest else None

    @property
    def availability_info(self):
        # 1. Age Verification Check (Under 18 Block)
        if self.calculated_age < 18:
            return {
                'status': 'underage',
                'label': 'Underage (Under 18)',
                'is_eligible': False,
                'days_remaining': 0,
                'next_eligible_date': 'Ineligible (Under 18)',
                'freshness': 'Under 18 Years Old'
            }

        latest_date = self.latest_donation_date
        if not latest_date:
            return {
                'status': 'available',
                'label': 'Available',
                'is_eligible': True,
                'days_remaining': 0,
                'next_eligible_date': 'Eligible Now',
                'freshness': f"Confirmed {self.last_confirmed_at.strftime('%b %d')}"
            }
        
        cooldown_days = 90
        if isinstance(latest_date, str):
            latest_date = date.fromisoformat(latest_date.split('T')[0])
            
        next_eligible = latest_date + timedelta(days=cooldown_days)
        today = date.today()
        diff = (next_eligible - today).days

        if diff <= 0:
            return {
                'status': 'available',
                'label': 'Available',
                'is_eligible': True,
                'days_remaining': 0,
                'next_eligible_date': 'Eligible Now',
                'freshness': f"Confirmed {self.last_confirmed_at.strftime('%b %d')}"
            }
        else:
            return {
                'status': 'recently_donated',
                'label': 'Recently Donated',
                'is_eligible': False,
                'days_remaining': diff,
                'next_eligible_date': next_eligible.strftime('%B %d, %Y'),
                'freshness': f"Donated on {latest_date.strftime('%b %d, %Y')}"
            }


class DonationRecord(models.Model):
    donor = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='donation_records')
    donation_date = models.DateField(default=date.today)
    location = models.CharField(max_length=150, default='UAP Blood Bank Center')
    verification_status = models.CharField(max_length=20, default='verified') # verified vs self_reported
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Donation by {self.donor.full_name} on {self.donation_date}"


class BloodRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='blood_requests')
    patient_name = models.CharField(max_length=100)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES)
    units_needed = models.PositiveIntegerField(default=1)
    hospital_name = models.CharField(max_length=150)
    hospital_location = models.CharField(max_length=150)
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='urgent')
    when_needed = models.CharField(max_length=100, default='As soon as possible')
    contact_person = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=20)
    additional_info = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=REQUEST_STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request for {self.blood_group} ({self.units_needed} units) - {self.hospital_name}"


class ContactRequest(models.Model):
    requester_name = models.CharField(max_length=100)
    requester_phone = models.CharField(max_length=20)
    donor = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='contact_requests')
    blood_request = models.ForeignKey(BloodRequest, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Contact Request from {self.requester_name} to {self.donor.full_name}"


class ProfileReport(models.Model):
    reporter_name = models.CharField(max_length=100, default='Anonymous User')
    reported_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=30, choices=REPORT_REASON_CHOICES)
    details = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report against {self.reported_profile.full_name} for {self.reason}"
