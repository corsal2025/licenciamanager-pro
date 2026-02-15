import requests

BASE_URL = "http://localhost:8000"

def test_flow():
    # 1. Login as Admin
    print("1. Logging in as admin...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": "admin", "password": "admin123"})
    if resp.status_code != 200:
        print(f"Failed to login: {resp.text}")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   Login success.")

    # 2. List Users
    print("\n2. Get Users (Initial)...")
    resp = requests.get(f"{BASE_URL}/users/", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to get users: {resp.text}")
    else:
        print(f"   Users found: {len(resp.json())}")
        print(f"   {resp.json()}")

    # 3. Create User
    print("\n3. Create New User...")
    new_user = {
        "username": "TEST.USER",
        "full_name": "Test User",
        "password": "testpassword123",
        "role": "OPERATOR"
    }
    resp = requests.post(f"{BASE_URL}/users/", json=new_user, headers=headers)
    if resp.status_code == 200:
        print("   User created successfully.")
    else:
        print(f"   Failed to create user: {resp.text}")

    # 4. List Users Again
    print("\n4. Get Users (After Create)...")
    resp = requests.get(f"{BASE_URL}/users/", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to get users: {resp.text}")
    else:
        users = resp.json()
        print(f"   Users found: {len(users)}")
        found = any(u['username'] == "TEST.USER" for u in users)
        print(f"   Test user found in list: {found}")

    # 5. Delete User (Cleanup)
    print("\n5. Delete Test User...")
    resp = requests.delete(f"{BASE_URL}/users/TEST.USER", headers=headers)
    if resp.status_code == 200:
        print("   User deleted.")
    else:
        print(f"   Failed to delete user: {resp.text}")

if __name__ == "__main__":
    try:
        test_flow()
    except Exception as e:
        print(f"An error occurred: {e}")
