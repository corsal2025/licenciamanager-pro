
import re

def validate_rut(rut: str) -> bool:
    """
    Validates a Chilean RUT.
    Accepts format with or without points and hyphen (e.g., 12.345.678-9 or 12345678-9).
    """
    rut = rut.replace(".", "").replace("-", "").upper()
    
    if len(rut) < 2:
        return False
        
    cuerpo = rut[:-1]
    dv = rut[-1]
    
    if not cuerpo.isdigit():
        return False
        
    try:
        total = 0
        multiplo = 2
        
        for d in reversed(cuerpo):
            total += int(d) * multiplo
            multiplo += 1
            if multiplo == 8:
                multiplo = 2
        
        resto = total % 11
        dv_calculado = 11 - resto
        
        if dv_calculado == 11:
            dv_esperado = '0'
        elif dv_calculado == 10:
            dv_esperado = 'K'
        else:
            dv_esperado = str(dv_calculado)
            
        return dv == dv_esperado
        
    except Exception:
        return False

def format_rut(rut: str) -> str:
    """
    Formats a RUT to '12.345.678-9' style.
    """
    rut = rut.replace(".", "").replace("-", "").upper()
    if len(rut) < 2:
        return rut
        
    cuerpo = rut[:-1]
    dv = rut[-1]
    
    # Add points
    cuerpo_fmt = "{:,}".format(int(cuerpo)).replace(",", ".")
    return f"{cuerpo_fmt}-{dv}"
