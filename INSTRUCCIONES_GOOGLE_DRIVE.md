# Guía de Configuración: Google Drive API

Para que el sistema pueda guardar archivos en tu Google Drive real, necesitamos una "Cuenta de Servicio" (Service Account).

## Paso 1: Crear Proyecto en Google Cloud
1.  Ingresa a [Google Cloud Console](https://console.cloud.google.com/).
2.  Arriba a la izquierda, selecciona o crea un **Nuevo Proyecto** (ej: `licencia-manager`).

## Paso 2: Habilitar la API
1.  En el menú de la izquierda, ve a **APIs y servicios** > **Biblioteca**.
2.  Busca **"Google Drive API"**.
3.  Haz clic en **Habilitar**.

## Paso 3: Crear Credenciales (Service Account)
1.  Ve a **APIs y servicios** > **Credenciales**.
2.  Haz clic en **+ CREAR CREDENCIALES** > **Cuenta de servicio**.
3.  Ponle un nombre (ej: `bot-carga-archivos`).
4.  Haz clic en **Crear y Continuar** (puedes saltar los pasos de roles opcionales dando "Continuar" y "Listo").

## Paso 4: Generar la Llave (El archivo JSON)
1.  En la lista de "Cuentas de servicio", haz clic en el **email** de la cuenta que acabas de crear (algo como `bot-carga...@...iam.gserviceaccount.com`).
2.  Ve a la pestaña **Claves** (arriba).
3.  Haz clic en **Agregar clave** > **Crear clave nueva**.
4.  Selecciona **JSON** y dale a **Crear**.
5.  **Se descargará un archivo automáticamente**. Este es el archivo que necesitamos.

## Paso 5: Instalar en el Proyecto
1.  Ubica el archivo descargado.
2.  Abre el archivo con un bloc de notas y copia todo su contenido.
3.  En este proyecto, abre (o crea) el archivo:
    `backend/credentials.json`
4.  Pega el contenido allí.

## ¡MUY IMPORTANTE!: Compartir Carpeta
Para que el bot pueda ver y escribir en tu carpeta de Drive:
1.  Copia el **email** de la cuenta de servicio (el que termina en `...iam.gserviceaccount.com`).
2.  Ve a tu Google Drive personal (en el navegador).
3.  Haz clic derecho en la carpeta donde quieres que se guarden los archivos.
4.  Dale a **Compartir** e invita a ese email como "Editor".

---
Una vez hecho esto, avísame para continuar con la integración.
