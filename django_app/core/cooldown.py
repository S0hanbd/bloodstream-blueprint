from datetime import datetime, date, timedelta

DONATION_COOLDOWN_DAYS = 90

def calculate_donation_eligibility(last_donation_date_str=None):
    """
    Calculates blood donation eligibility based on the 90-day medical recovery rule.
    """
    if not last_donation_date_str:
        return {
            'is_eligible': True,
            'days_remaining': 0,
            'next_eligible_date': None,
            'formatted_next_eligible_date': 'Eligible Now',
        }

    try:
        if isinstance(last_donation_date_str, (datetime, date)):
            donation_date = last_donation_date_str if isinstance(last_donation_date_str, date) else last_donation_date_str.date()
        else:
            clean_str = str(last_donation_date_str).split('T')[0]
            donation_date = datetime.strptime(clean_str, '%Y-%m-%d').date()

        next_eligible = donation_date + timedelta(days=DONATION_COOLDOWN_DAYS)
        today = date.today()
        diff_days = (next_eligible - today).days

        if diff_days <= 0:
            return {
                'is_eligible': True,
                'days_remaining': 0,
                'next_eligible_date': next_eligible,
                'formatted_next_eligible_date': 'Eligible Now',
            }

        return {
            'is_eligible': False,
            'days_remaining': diff_days,
            'next_eligible_date': next_eligible,
            'formatted_next_eligible_date': next_eligible.strftime('%B %d, %Y'),
        }
    except (ValueError, TypeError):
        return {
            'is_eligible': True,
            'days_remaining': 0,
            'next_eligible_date': None,
            'formatted_next_eligible_date': 'Eligible Now',
        }
