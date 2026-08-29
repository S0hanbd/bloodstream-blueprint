from django import forms
from datetime import date
from .models import UserProfile, BloodRequest, ContactRequest, ProfileReport, BLOOD_GROUP_CHOICES, USER_TYPE_CHOICES, SEX_CHOICES, URGENCY_CHOICES, REPORT_REASON_CHOICES

class SingleRegistrationForm(forms.Form):
    uap_id = forms.CharField(
        label="UAP ID *",
        max_length=20,
        widget=forms.TextInput(attrs={
            'placeholder': 'e.g. 14101095',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    full_name = forms.CharField(
        label="Full Name *",
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'e.g. Tanvir Hasan',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    user_type = forms.ChoiceField(
        label="UAP Identity *",
        choices=USER_TYPE_CHOICES,
        widget=forms.Select(attrs={
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
        })
    )
    date_of_birth = forms.DateField(
        label="Date of Birth (Mandatory 18+ Verification) *",
        widget=forms.DateInput(attrs={
            'type': 'date',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    biological_sex = forms.ChoiceField(
        label="Biological sex for donor eligibility * (Private - Not displayed publicly)",
        choices=SEX_CHOICES,
        widget=forms.Select(attrs={
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    phone_number = forms.CharField(
        label="Phone Number *",
        max_length=20,
        widget=forms.TextInput(attrs={
            'placeholder': 'e.g. 01711223344',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    email = forms.EmailField(
        label="Institutional Email (Instant Verification with @uap-bd.edu)",
        required=False,
        widget=forms.EmailInput(attrs={
            'placeholder': 'student@uap-bd.edu',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
        })
    )
    password = forms.CharField(
        label="Password *",
        min_length=6,
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Create password (min 6 chars)',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    confirm_password = forms.CharField(
        label="Confirm Password *",
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Re-enter password',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    blood_group = forms.ChoiceField(
        label="Blood Group *",
        choices=[('', 'Select Blood Group')] + BLOOD_GROUP_CHOICES,
        widget=forms.Select(attrs={
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    department = forms.CharField(
        label="Department *",
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'e.g. Computer Science & Engineering',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    batch_name = forms.CharField(
        label="Batch / Semester *",
        max_length=50,
        widget=forms.TextInput(attrs={
            'placeholder': 'e.g. Fall 2021',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    city_area = forms.CharField(
        label="Location / City Area *",
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'e.g. Dhanmondi, Dhaka',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    has_donated_before = forms.BooleanField(
        label="Have you donated blood before?",
        required=False,
        widget=forms.CheckboxInput(attrs={
            'class': 'w-4 h-4 text-red-600 rounded focus:ring-red-500',
            'id': 'id_has_donated_before'
        })
    )
    last_donation_date = forms.CharField(
        label="Last Donation Date",
        required=False,
        widget=forms.DateInput(attrs={
            'type': 'date',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
        })
    )
    
    # Privacy Options
    show_phone_publicly = forms.BooleanField(
        label="Show my phone number publicly on donor search cards",
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={'class': 'w-4 h-4 text-red-600 rounded focus:ring-red-500'})
    )
    allow_contact_requests = forms.BooleanField(
        label="Allow people to contact me about blood donation requests",
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={'class': 'w-4 h-4 text-red-600 rounded focus:ring-red-500'})
    )
    profile_visible = forms.BooleanField(
        label="Show my profile in blood donor search results",
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={'class': 'w-4 h-4 text-red-600 rounded focus:ring-red-500'})
    )

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")
        dob = cleaned_data.get("date_of_birth")

        if password and confirm_password and password != confirm_password:
            self.add_error('confirm_password', "Passwords do not match.")

        # Mandatory Age Verification (Calculated server-side)
        if dob:
            today = date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            if age < 18:
                self.add_error('date_of_birth', "You must be at least 18 years old to register as a donor.")

        return cleaned_data


class LoginForm(forms.Form):
    identifier = forms.CharField(
        label="UAP ID or Email",
        widget=forms.TextInput(attrs={
            'placeholder': 'Enter your UAP ID or Email',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )
    password = forms.CharField(
        label="Password",
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Enter your password',
            'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition',
            'required': True,
        })
    )


class BloodRequestForm(forms.ModelForm):
    class Meta:
        model = BloodRequest
        fields = ['patient_name', 'blood_group', 'units_needed', 'hospital_name', 'hospital_location', 'urgency', 'when_needed', 'contact_person', 'contact_phone', 'additional_info']
        widgets = {
            'patient_name': forms.TextInput(attrs={'placeholder': 'e.g. Patient Name / Initials', 'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
            'blood_group': forms.Select(attrs={'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
            'units_needed': forms.NumberInput(attrs={'min': 1, 'max': 10, 'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
            'hospital_name': forms.TextInput(attrs={'placeholder': 'e.g. Square Hospital / Dhaka Medical', 'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
            'hospital_location': forms.TextInput(attrs={'placeholder': 'e.g. Panthapath, Dhaka', 'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
            'urgency': forms.Select(attrs={'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
            'when_needed': forms.TextInput(attrs={'placeholder': 'e.g. Immediately / Tomorrow 10:00 AM', 'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
            'contact_person': forms.TextInput(attrs={'placeholder': 'e.g. Relative Name', 'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
            'contact_phone': forms.TextInput(attrs={'placeholder': 'e.g. 01711000000', 'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
            'additional_info': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Provide details about condition or medical requirements...', 'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
        }


class ProfileReportForm(forms.ModelForm):
    class Meta:
        model = ProfileReport
        fields = ['reason', 'details']
        widgets = {
            'reason': forms.Select(attrs={'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
            'details': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Explain why you are reporting this donor profile...', 'class': 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}),
        }
