import requests
import time

BASE_URL = "http://localhost:8000"
ADMIN_USER = "admin"
ADMIN_PASS = "admin123"

def test_update_flow():
    # 1. Login
    print("1. Login as Admin...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": ADMIN_USER, "password": ADMIN_PASS})
    if resp.status_code != 200:
        print("Login failed. Is the server running?")
        exit(1)
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create Temp User
    test_user_id = "UPDATE.TEST"
    print(f"2. Creating test user {test_user_id}...")
    requests.delete(f"{BASE_URL}/users/{test_user_id}", headers=headers) # Clean start
    
    payload = {
        "username": test_user_id,
        "full_name": "Original Name",
        "password": "pass1234",
        "role": "OPERATOR"
    }
    resp = requests.post(f"{BASE_URL}/users/", json=payload, headers=headers)
    assert resp.status_code == 200, f"Creation failed: {resp.text}"
    
    # 3. Update Name
    print("3. Updating User Name...")
    update_payload = {"full_name": "Updated Name"}
    resp = requests.put(f"{BASE_URL}/users/{test_user_id}", json=update_payload, headers=headers)
    assert resp.status_code == 200, f"Update failed: {resp.text}"
    data = resp.json()
    assert data["full_name"] == "Updated Name", "Name not updated in response"
    
    # 4. Verify Persistence
    print("4. Verifying persistence...")
    resp = requests.get(f"{BASE_URL}/users/", headers=headers)
    users = resp.json()
    user = next(u for u in users if u["username"] == test_user_id)
    assert user["full_name"] == "Updated Name", "Name not persisted"
    
    # 5. Update Password
    print("5. Updating Password...")
    new_pass = "newpass5678"
    update_pass = {"password": new_pass}
    resp = requests.put(f"{BASE_URL}/users/{test_user_id}", json=update_pass, headers=headers)
    assert resp.status_code == 200
    
    # 6. Verify Login with New Password
    print("6. Verifying new password login...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": test_user_id, "password": new_pass})
    assert resp.status_code == 200, "Login with new password failed"
    
    # 7. Clean up
    print("7. Cleaning up...")
    requests.delete(f"{BASE_URL}/users/{test_user_id}", headers=headers)
    print("SUCCESS: User Update verified!")

if __name__ == "__main__":
    try:
        test_update_flow()
    except Exception as e:
        print(f"FAILURE: {e}")
