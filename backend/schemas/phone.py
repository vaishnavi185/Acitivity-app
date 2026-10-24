import re


def normalize_phone_number(phone_number: str) -> str:
    normalized = re.sub(r"[\s()-]", "", phone_number)
    if not re.fullmatch(r"\+?[1-9]\d{6,14}", normalized):
        raise ValueError(
            "Phone number must contain 7 to 15 digits and may start with +"
        )
    return normalized
