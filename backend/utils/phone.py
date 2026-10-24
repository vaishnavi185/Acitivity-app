import phonenumbers
from fastapi import HTTPException
from phonenumbers import NumberParseException, PhoneNumberFormat


def normalize_phone(raw: str, default_region: str = "IN") -> str:
    try:
        phone = phonenumbers.parse(raw, default_region)
    except NumberParseException as error:
        raise HTTPException(
            status_code=422,
            detail="Invalid mobile number",
        ) from error

    if not phonenumbers.is_valid_number(phone):
        raise HTTPException(
            status_code=422,
            detail="Invalid mobile number",
        )

    return phonenumbers.format_number(phone, PhoneNumberFormat.E164)
