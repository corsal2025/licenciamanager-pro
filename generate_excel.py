import pandas as pd
from datetime import datetime, timedelta
import random

# Create sample data
data = {
    'Rut': [f'{random.randint(10, 25)}.{random.randint(100, 999)}.{random.randint(100, 999)}-{random.randint(0, 9)}' for _ in range(20)],
    'Nombre': [f'Conductor {i}' for i in range(1, 21)],
    'Clase': [random.choice(['B', 'A2', 'A4', 'C']) for _ in range(20)],
    'Vencimiento': [(datetime.now() + timedelta(days=random.randint(-30, 365))).strftime('%Y-%m-%d') for _ in range(20)],
    'Estado': ['Vigente' for _ in range(20)]
}

# Create DataFrame
df = pd.DataFrame(data)

# Save to Excel
df.to_excel('test_licencias.xlsx', index=False)
print("Archivo test_licencias.xlsx creado exitosamente")
