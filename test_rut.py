
print("Testing RUT Validation...")
from backend.utils.rut import validate_rut, format_rut

# Test Cases
tests = [
    ("12.345.678-5", True),
    ("12345678-5", True),
    ("1-9", True),
    ("1-8", False), # Bad DV
    ("12.345.678-K", False), # Assuming it's not K
    ("30.686.957-4", True) # Example valid
]

for rut, expected in tests:
    result = validate_rut(rut)
    status = "✅ PASS" if result == expected else "❌ FAIL"
    print(f"RUT: {rut} | Expected: {expected} | Got: {result} | {status}")
    if result:
        print(f"   Formatted: {format_rut(rut)}")

print("Done.")
