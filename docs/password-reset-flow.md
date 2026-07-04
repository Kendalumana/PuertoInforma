# Flujo de recuperacion de contrasena

Este modulo usa dos pantallas del frontend:

- `/recuperar-clave`: el usuario escribe su correo.
- `/restablecer-clave?token=<JWT>`: el usuario crea una contrasena nueva usando el token recibido por correo.

## 1. Solicitar recuperacion

Frontend:

```http
POST /api/v1/usuario/password/forgot
Content-Type: application/json

{
  "email": "usuario@correo.com"
}
```

Respuesta recomendada:

```json
{
  "message": "Si el correo existe, enviaremos un enlace de recuperacion."
}
```

Importante: la API deberia responder igual aunque el correo no exista. Asi no se filtra si una cuenta esta registrada.

## 2. Generar JWT de recuperacion

Backend:

1. Buscar el usuario por email.
2. Si existe, generar un JWT corto, por ejemplo 15 minutos.
3. Firmarlo con una clave diferente a la del login si es posible.
4. Incluir proposito para que no se pueda usar como token normal.

Claims sugeridos:

```json
{
  "sub": "123",
  "email": "usuario@correo.com",
  "purpose": "PASSWORD_RESET",
  "iat": 1760000000,
  "exp": 1760000900,
  "jti": "uuid-unico"
}
```

Recomendado: guardar el `jti` hasheado en base de datos para permitir un solo uso.

## 3. Enviar correo

El correo debe contener un link como:

```text
https://tu-dominio.com/restablecer-clave?token=<JWT>
```

En desarrollo local:

```text
http://localhost:5173/restablecer-clave?token=<JWT>
```

Variables utiles:

```env
FRONTEND_URL=https://tu-dominio.com
JWT_RESET_SECRET=clave_larga_y_distinta
```

## 4. Restablecer contrasena

Frontend:

```http
POST /api/v1/usuario/password/reset
Content-Type: application/json

{
  "token": "<JWT>",
  "password": "nuevaContrasena123"
}
```

Backend:

1. Verificar firma del JWT.
2. Verificar expiracion.
3. Verificar `purpose === "PASSWORD_RESET"`.
4. Verificar que el `jti` no haya sido usado.
5. Hashear la nueva contrasena.
6. Guardar la nueva contrasena.
7. Marcar el `jti` como usado.
8. Invalidar sesiones activas si el backend maneja refresh tokens.

Respuesta recomendada:

```json
{
  "message": "Contrasena actualizada correctamente."
}
```

## 5. Seguridad minima

- No guardar el JWT de recuperacion en `localStorage`.
- Usar expiracion corta: 10 a 20 minutos.
- Usar HTTPS en produccion.
- Aplicar rate limit al endpoint `/password/forgot`.
- No revelar si el correo existe.
- Hashear contrasenas con BCrypt, Argon2 o similar.
- Usar JWT de recuperacion solo para restablecer contrasena, nunca para autenticar.
