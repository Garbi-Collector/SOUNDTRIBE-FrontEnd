# Etapa 1: Imagen base mínima para servir contenido estático
FROM nginx:alpine

# Elimina la configuración por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia los archivos estáticos del build de Angular al directorio de Nginx
COPY dist/soundtribe-front-end/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Opcional: Copiar una configuración personalizada de Nginx (para redirecciones por ejemplo)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80
EXPOSE 80

# El contenedor se ejecuta con Nginx por defecto, no hace falta CMD



# garbi21/soundtribe-users-api
