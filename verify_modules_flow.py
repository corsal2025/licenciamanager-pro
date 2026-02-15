import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def log(msg):
    print(f"[TEST] {msg}")

def test_flow():
    # 1. Wait for server (assuming user or I start it in background, but I will try to start it or assume it's running. 
    # Actually, I should probably rely on the existing backend tests or run this against a temp server. 
    # For now, I'll write it to be run AFTER I start the server).
    
    # Login Mock (Setup basic headers if auth enabled, or just hit endpoints if open)
    # The app seems to use a token but let's see if we can just hit endpoints directly if auth is loose or we get a token.
    # Looking at authService, it uses /token.
    
    # 1. Login
    log("Attempting Login...")
    try:
        payload = {"username": "admin", "password": "adminpassword"} # Assuming default or from seed
        response = requests.post(f"{BASE_URL}/token", data=payload)
        if response.status_code != 200:
             # Try creating the user first?
             log("Login failed. Trying to create admin user...")
             user_payload = {"username": "admin", "password": "adminpassword", "full_name": "Admin Test", "role": "ADMINISTRADOR"}
             requests.post(f"{BASE_URL}/users/", json=user_payload)
             response = requests.post(f"{BASE_URL}/token", data=payload)
        
        token = response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        log("Login Successful.")
    except Exception as e:
        log(f"Login/Setup failed: {e}")
        return

    # 2. Create Test License
    rut = "99.999.999-K"
    log(f"Creating Test License: {rut}")
    license_data = {
        "rut": rut,
        "full_name": "TEST USER FLOW",
        "license_number": "12345",
        "category": "B",
        "last_control_date": "2024-01-01",
        "status": "VIGENTE",
        "process_status": "PENDIENTE",
        "upload_date": int(time.time()),
        "uploaded_by": "admin",
        "email": "test@example.com",
        "phone": "912345678"
    }
    
    # Cleanup first
    requests.delete(f"{BASE_URL}/licenses/{rut}", headers=headers)
    
    res = requests.post(f"{BASE_URL}/licenses/", json=license_data, headers=headers)
    if res.status_code != 200:
        log(f"Creation Failed: {res.text}")
        return
    log("License Created.")

    # 3. Test Module 12: Move to Ready for Pickup
    log("--> Moving to 'LISTA PARA ENTREGA' (Module 12 Trigger)")
    update_data = {
        "rut": rut, 
        "full_name": "TEST USER FLOW", # Required fields
        "process_status": "LISTA PARA ENTREGA"
    }
    res = requests.put(f"{BASE_URL}/licenses/{rut}", json=update_data, headers=headers)
    assert res.json()['process_status'] == "LISTA PARA ENTREGA"
    log("Status Updated. App should now show this in Module 12.")

    # 4. Test Delivery
    log("--> Simulating Delivery Action")
    update_data['process_status'] = "ENTREGADA"
    res = requests.put(f"{BASE_URL}/licenses/{rut}", json=update_data, headers=headers)
    assert res.json()['process_status'] == "ENTREGADA"
    log("License Delivered.")

    # 5. Test Module 16: Force Error
    log("--> Moving to 'DENEGADA' (Module 16 Trigger)")
    update_data['process_status'] = "DENEGADA"
    res = requests.put(f"{BASE_URL}/licenses/{rut}", json=update_data, headers=headers)
    assert res.json()['process_status'] == "DENEGADA"
    log("Status Updated. App should now show this in Module 16.")
    
    log("VERIFICATION SUCCESSFUL: Full flow executed.")

if __name__ == "__main__":
    try:
        test_flow()
    except Exception as e:
        log(f"Test crashed: {e}")
