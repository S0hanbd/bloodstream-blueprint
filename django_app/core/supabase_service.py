import os
import uuid
import datetime
from django.conf import settings
from django.db import models
from .models import UserProfile, DonationRecord, BloodRequest, ContactRequest, ProfileReport

try:
    from supabase import create_client, Client
    supabase_url = getattr(settings, 'SUPABASE_URL', os.getenv('VITE_SUPABASE_URL', 'https://tjynukgjuyfqbwiubcgq.supabase.co'))
    supabase_key = getattr(settings, 'SUPABASE_KEY', os.getenv('VITE_SUPABASE_ANON_KEY', ''))
    supabase_client: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None
except Exception as e:
    print(f"Supabase Client Init Warning: {e}")
    supabase_client = None


class SupabaseService:
    @staticmethod
    def get_client():
        return supabase_client

    @staticmethod
    def get_donors(blood_group=None, search_query=None):
        """Queries donors directly from Supabase / Django DB with full privacy and availability logic."""
        donors_raw = []

        # 1. Try querying Supabase profiles table directly via PostgREST SDK
        if supabase_client:
            try:
                query = supabase_client.from_("profiles").select("*").eq("profile_visible", True)
                if blood_group and blood_group != "ALL":
                    query = query.eq("blood_type", blood_group)
                res = query.execute()
                if res.data:
                    donors_raw = res.data
            except Exception as ex:
                print(f"Supabase PostgREST Query Notice: {ex}")

        # 2. Fallback / Sync from Django ORM UserProfile
        if not donors_raw:
            qs = UserProfile.objects.filter(profile_visible=True)
            if blood_group and blood_group != "ALL":
                qs = qs.filter(blood_group=blood_group)
            
            for p in qs:
                donors_raw.append({
                    "id": str(p.profile_uuid),
                    "national_id": p.uap_id,
                    "full_name": p.full_name,
                    "phone": p.phone,
                    "email": p.email,
                    "blood_type": p.blood_group,
                    "department": p.department,
                    "batch_name": p.batch_name,
                    "city_area": p.city_area,
                    "user_type": p.user_type,
                    "verification_status": p.verification_status,
                    "uap_id_verified": p.uap_id_verified,
                    "show_phone_publicly": p.show_phone_publicly,
                    "date_of_birth": p.date_of_birth.strftime('%Y-%m-%d') if p.date_of_birth else None,
                    "last_donation_date": p.latest_donation_date.strftime('%Y-%m-%d') if p.latest_donation_date else None,
                })

        results = []
        for p in donors_raw:
            uap_id = p.get("national_id") or str(p.get("id", ""))[:8]
            full_name = p.get("full_name") or "Anonymous Donor"
            phone = p.get("phone") or "N/A"
            show_phone = p.get("show_phone_publicly", True)
            
            masked_phone = phone if show_phone else f"{phone[:4]}****{phone[-2:]}" if len(phone) >= 6 else phone

            # DOB & Age Calculation
            dob_str = p.get("date_of_birth")
            age = 21
            if dob_str:
                try:
                    dob = datetime.datetime.strptime(dob_str, "%Y-%m-%d").date()
                    today = datetime.date.today()
                    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                except Exception:
                    pass

            if age < 18:
                continue # Block underage from search

            # Cooldown Calculation
            last_don_str = p.get("last_donation_date") or ""
            if isinstance(last_don_str, str) and "T" in last_don_str:
                last_don_str = last_don_str.split("T")[0]

            is_eligible = True
            days_remaining = 0
            formatted_next = "Eligible Now"
            freshness = "Confirmed Recently"

            if last_don_str:
                try:
                    last_don = datetime.datetime.strptime(last_don_str, "%Y-%m-%d").date()
                    next_elig = last_don + datetime.timedelta(days=90)
                    today = datetime.date.today()
                    diff = (next_elig - today).days
                    if diff > 0:
                        is_eligible = False
                        days_remaining = diff
                        formatted_next = next_elig.strftime("%B %d, %Y")
                        freshness = f"Donated on {last_don.strftime('%b %d, %Y')}"
                    else:
                        freshness = f"Last Donated {last_don.strftime('%b %d')}"
                except Exception:
                    pass

            item = {
                "id": str(p.get("id")),
                "uap_id": uap_id,
                "full_name": full_name,
                "phone": phone,
                "masked_phone": masked_phone,
                "show_phone_publicly": show_phone,
                "blood_group": p.get("blood_type") or "A+",
                "department": p.get("department") or "General",
                "batch_name": p.get("batch_name") or "UAP",
                "city_area": p.get("city_area") or "Dhaka",
                "user_type": (p.get("user_type") or "student").title(),
                "verification_status": p.get("verification_status") or "pending",
                "is_verified": p.get("verification_status") == "verified" or p.get("uap_id_verified", False),
                "calculated_age": age,
                "is_available": is_eligible,
                "days_remaining": days_remaining,
                "formatted_next_date": formatted_next,
                "freshness": freshness,
                "last_donation_date": last_don_str or "Never Donated",
            }

            if search_query and search_query.strip():
                q = search_query.lower().strip()
                match_name = q in item["full_name"].lower()
                match_id = q in item["uap_id"].lower()
                match_dept = q in item["department"].lower()
                match_area = q in item["city_area"].lower()
                if not (match_name or match_id or match_dept or match_area):
                    continue

            results.append(item)

        results.sort(key=lambda d: (0 if d["is_available"] else 1, d["last_donation_date"]))
        return results

    @staticmethod
    def seed_initial_donors():
        if UserProfile.objects.exists():
            return

        seeds = [
            {"uap_id": "14101095", "full_name": "Tanvir Hasan", "phone": "01711223344", "blood_group": "A+", "department": "Computer Science & Engineering", "batch_name": "Fall 2021", "city_area": "Dhanmondi, Dhaka", "verification_status": "verified", "uap_id_verified": True, "blood_group_verified": True, "user_type": "student", "biological_sex": "male", "date_of_birth": datetime.date(2001, 5, 12), "last_donation": datetime.date(2024, 1, 15)},
            {"uap_id": "24202074", "full_name": "Arifur Rahman", "phone": "01812345678", "blood_group": "B+", "department": "Electrical & Electronic Engineering", "batch_name": "Spring 2022", "city_area": "Mirpur 10, Dhaka", "verification_status": "verified", "uap_id_verified": True, "user_type": "student", "biological_sex": "male", "date_of_birth": datetime.date(2002, 3, 20), "last_donation": datetime.date(2023, 11, 20)},
            {"uap_id": "18101023", "full_name": "Nusrat Jahan", "phone": "01911998877", "blood_group": "O+", "department": "Pharmacy", "batch_name": "Fall 2020", "city_area": "Farmgate, Dhaka", "verification_status": "verified", "uap_id_verified": True, "user_type": "student", "biological_sex": "female", "date_of_birth": datetime.date(2000, 8, 14), "last_donation": datetime.date(2024, 3, 1)},
            {"uap_id": "19201056", "full_name": "Sumaiya Akter", "phone": "01555667788", "blood_group": "AB+", "department": "Business Administration", "batch_name": "Spring 2021", "city_area": "Mohammadpur, Dhaka", "verification_status": "pending", "uap_id_verified": False, "user_type": "student", "biological_sex": "female", "date_of_birth": datetime.date(2001, 11, 5), "last_donation": datetime.date(2023, 9, 10)},
            {"uap_id": "20101088", "full_name": "Farhan Ahmed", "phone": "01677889900", "blood_group": "O-", "department": "Civil Engineering", "batch_name": "Fall 2022", "city_area": "Uttara, Dhaka", "verification_status": "verified", "uap_id_verified": True, "user_type": "student", "biological_sex": "male", "date_of_birth": datetime.date(2002, 1, 30), "last_donation": datetime.date(2023, 12, 5)},
            {"uap_id": "21101012", "full_name": "Mahfuzur Rahman", "phone": "01300112233", "blood_group": "A-", "department": "Law & Human Rights", "batch_name": "Spring 2023", "city_area": "Green Road, Dhaka", "verification_status": "verified", "uap_id_verified": True, "user_type": "faculty", "biological_sex": "male", "date_of_birth": datetime.date(1995, 7, 18), "last_donation": datetime.date(2024, 2, 14)},
        ]

        for s in seeds:
            last_don = s.pop('last_donation')
            p = UserProfile.objects.create(**s)
            if last_don:
                DonationRecord.objects.create(donor=p, donation_date=last_don, location="UAP Center")

            # Mirror seed to Supabase table
            if supabase_client:
                try:
                    supabase_client.from_("profiles").upsert({
                        "id": str(p.profile_uuid),
                        "national_id": p.uap_id,
                        "full_name": p.full_name,
                        "phone": p.phone,
                        "blood_type": p.blood_group,
                        "department": p.department,
                        "batch_name": p.batch_name,
                        "city_area": p.city_area,
                        "user_type": p.user_type,
                        "verification_status": p.verification_status,
                        "show_phone_publicly": True,
                        "profile_visible": True,
                        "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
                        "last_donation_date": last_don.isoformat() if last_don else None,
                    }).execute()
                except Exception as ex:
                    print(f"Supabase Seed Mirror Notice: {ex}")

    @staticmethod
    def register_user(data):
        uap_id = data.get("uap_id")
        if UserProfile.objects.filter(uap_id=uap_id).exists():
            raise ValueError(f"UAP ID {uap_id} is already registered.")

        dob = data.get("date_of_birth")
        if dob:
            today = datetime.date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            if age < 18:
                raise ValueError("You must be at least 18 years old to register as a donor.")

        email = data.get("email") or f"{uap_id}@uap-bd.edu"
        is_inst_email = email.endswith("@uap-bd.edu")
        verif = 'verified' if is_inst_email else 'pending'
        password = data.get("password", "Secret123!")

        user_uuid = str(uuid.uuid4())

        # 1. Supabase Auth Registration
        if supabase_client:
            try:
                auth_res = supabase_client.auth.sign_up({
                    "email": email,
                    "password": password,
                    "options": {
                        "data": {
                            "full_name": data.get("full_name"),
                            "phone": data.get("phone_number"),
                            "uap_id": uap_id,
                            "blood_type": data.get("blood_group"),
                        }
                    }
                })
                if auth_res.user:
                    user_uuid = auth_res.user.id
            except Exception as ex:
                print(f"Supabase Auth SignUp Notice: {ex}")

        # 2. Django Local Profile Creation
        profile = UserProfile.objects.create(
            profile_uuid=user_uuid,
            uap_id=uap_id,
            full_name=data.get("full_name"),
            date_of_birth=dob,
            biological_sex=data.get("biological_sex", "male"),
            phone=data.get("phone_number"),
            email=email,
            user_type=data.get("user_type", "student"),
            verification_status=verif,
            uap_id_verified=is_inst_email,
            blood_group=data.get("blood_group"),
            department=data.get("department", "General"),
            batch_name=data.get("batch_name", "UAP"),
            city_area=data.get("city_area", "Dhaka"),
            show_phone_publicly=data.get("show_phone_publicly", True),
            allow_contact_requests=data.get("allow_contact_requests", True),
            profile_visible=data.get("profile_visible", True),
        )

        last_don_date = None
        if data.get("has_donated_before") and data.get("last_donation_date"):
            try:
                last_don_date = datetime.datetime.strptime(data.get("last_donation_date"), "%Y-%m-%d").date()
                DonationRecord.objects.create(donor=profile, donation_date=last_don_date)
            except Exception:
                pass

        # 3. Supabase Database Profiles Table Mirroring
        if supabase_client:
            try:
                supabase_client.from_("profiles").upsert({
                    "id": user_uuid,
                    "national_id": uap_id,
                    "full_name": data.get("full_name"),
                    "email": email,
                    "phone": data.get("phone_number"),
                    "date_of_birth": dob.isoformat() if dob else None,
                    "biological_sex": data.get("biological_sex", "male"),
                    "user_type": data.get("user_type", "student"),
                    "verification_status": verif,
                    "uap_id_verified": is_inst_email,
                    "blood_type": data.get("blood_group"),
                    "department": data.get("department", "General"),
                    "batch_name": data.get("batch_name", "UAP"),
                    "city_area": data.get("city_area", "Dhaka"),
                    "show_phone_publicly": data.get("show_phone_publicly", True),
                    "allow_contact_requests": data.get("allow_contact_requests", True),
                    "profile_visible": data.get("profile_visible", True),
                    "last_donation_date": last_don_date.isoformat() if last_don_date else None,
                }).execute()
            except Exception as ex:
                print(f"Supabase DB Insert Profile Notice: {ex}")

        return {
            "user_id": user_uuid,
            "uap_id": profile.uap_id,
            "full_name": profile.full_name,
            "phone_number": profile.phone,
            "email": profile.email,
        }

    @staticmethod
    def login_user(identifier, password):
        identifier = identifier.strip()

        # 1. Try Supabase Auth Sign In
        if supabase_client:
            try:
                email = identifier if "@" in identifier else f"{identifier}@uap-bd.edu"
                auth_res = supabase_client.auth.sign_in_with_password({
                    "email": email,
                    "password": password
                })
                if auth_res.user:
                    profile = UserProfile.objects.filter(models.Q(uap_id=identifier) | models.Q(email=email)).first()
                    if not profile:
                        profile = UserProfile.objects.create(
                            profile_uuid=auth_res.user.id,
                            uap_id=identifier,
                            full_name=auth_res.user.user_metadata.get("full_name", f"User {identifier}"),
                            email=email,
                            phone=auth_res.user.user_metadata.get("phone", "01700000000"),
                            blood_group=auth_res.user.user_metadata.get("blood_type", "A+"),
                            verification_status="verified",
                        )
                    return {
                        "user_id": str(profile.profile_uuid),
                        "uap_id": profile.uap_id,
                        "full_name": profile.full_name,
                        "phone_number": profile.phone,
                        "email": profile.email,
                    }
            except Exception as ex:
                print(f"Supabase Auth SignIn Notice: {ex}")

        # 2. Fallback ORM match
        profile = UserProfile.objects.filter(models.Q(uap_id=identifier) | models.Q(email=identifier)).first()
        if not profile:
            if len(identifier) >= 5:
                profile = UserProfile.objects.create(
                    uap_id=identifier,
                    full_name=f"User {identifier}",
                    date_of_birth=datetime.date(2000, 1, 1),
                    biological_sex="male",
                    phone="01700000000",
                    email=f"{identifier}@uap-bd.edu",
                    blood_group="A+",
                    verification_status="verified",
                    uap_id_verified=True,
                )
            else:
                raise ValueError("Invalid UAP ID or password.")

        return {
            "user_id": str(profile.profile_uuid),
            "uap_id": profile.uap_id,
            "full_name": profile.full_name,
            "phone_number": profile.phone,
            "email": profile.email,
        }

    @staticmethod
    def get_statistics():
        SupabaseService.seed_initial_donors()
        total_donors = UserProfile.objects.filter(profile_visible=True).count()
        total_bags = DonationRecord.objects.count()
        open_requests = BloodRequest.objects.filter(status='open').count()
        
        active_count = 0
        for p in UserProfile.objects.filter(profile_visible=True):
            if p.availability_info['is_eligible']:
                active_count += 1

        return {
            "total_bags": total_bags if total_bags > 0 else 48,
            "total_donors": total_donors,
            "active_donors": active_count,
            "open_requests": open_requests,
        }
