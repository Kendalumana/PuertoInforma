#  PuertoInforma

**PuertoInforma** es una plataforma web desarrollada con **React** diseñada para centralizar y visualizar información relevante de la zona local. El proyecto integra herramientas de mapeo dinámico para ofrecer una experiencia interactiva y accesible a los usuarios.

##  Características Principales

* **Interfaz Moderna:** Construida con React para una navegación rápida y fluida.
* **Mapas Interactivos:** Integración con **Leaflet** para la visualización de puntos de interés.
* **Diseño Responsivo:** Adaptado para su visualización en dispositivos móviles y escritorio.
* **Arquitectura de Componentes:** Código organizado y escalable.

##  Tecnologías Utilizadas

* **React.js:** Biblioteca principal para la interfaz.
* **Leaflet:** Librería para mapas interactivos.
* **CSS Moderno:** Estilización personalizada y diseño limpio.
* **Vite:** Herramienta de construcción para un desarrollo ágil.
## Configuración del Entorno

Para ejecutar este proyecto localmente, necesitas configurar las variables de entorno. Crea un archivo llamado `.env` en la raíz del proyecto y añade las siguientes variables (solicita los valores al administrador del sistema):

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
VITE_MIBUS_URL=https://mibus.cr/
```
> [!WARNING]
> **Seguridad:** Nunca incluyas claves privadas o de rol de servicio (como `SUPABASE_SERVICE_ROLE_KEY`) en el frontend, ya que quedan expuestas en el código fuente.

## Comandos Disponibles

En el directorio del proyecto, puedes ejecutar:

### `npm run dev`
Ejecuta la aplicación en modo desarrollo.
Abre [http://localhost:5173](http://localhost:5173) para verla en el navegador.

### `npm run build`
Construye la aplicación para producción en la carpeta `dist`. Empaqueta React en modo producción y optimiza el build para el mejor rendimiento.

### `npm run lint`
Ejecuta ESLint para analizar el código en busca de problemas.
