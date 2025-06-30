# 🏆 Generador de Equipos Dota 2

Un sistema inteligente para crear equipos balanceados de Dota 2 basándose en MMR y roles de los jugadores.

## 🎯 Características

- **Balance de MMR**: Intenta que todos los equipos tengan un MMR promedio similar
- **Distribución de Roles**: Evita duplicados de roles, especialmente en posiciones 1 y 2
- **Algoritmo Inteligente**: Prioriza jugadores con MMR alto en roles importantes (1 y 2)
- **Persistencia**: Guarda los datos en localStorage del navegador
- **Interfaz Moderna**: Diseño responsive y atractivo

## 🎮 Roles Disponibles

1. **Hard Carry** - Posición 1
2. **Midlane** - Posición 2  
3. **Offlane** - Posición 3
4. **Soft Support** - Posición 4
5. **Hard Support** - Posición 5

## 🚀 Cómo Usar

1. **Abrir el archivo**: Abre `index.html` en tu navegador
2. **Agregar jugadores**: Completa el formulario con:
   - Nombre del jugador
   - MMR (ej: 5600)
   - Rol (1-5)
3. **Generar equipos**: Los equipos se generan automáticamente
4. **Datos de prueba**: Usa el botón "Cargar Datos de Prueba" para ver el sistema en acción

## ⚙️ Algoritmo de Asignación

El sistema utiliza un algoritmo de puntuación que considera:

- **Penalización por roles duplicados** (-1000 puntos)
- **Penalización por roles cercanos** (-500 puntos para 1-2, -200 para 2-3)
- **Bonus por diversidad de roles** (+100 por rol faltante)
- **Balance de MMR** (penaliza diferencias grandes)
- **Prioridad para roles importantes** (bonus para MMR alto en posiciones 1 y 2)

## 📊 Estadísticas

El sistema muestra:
- Número de equipos formados
- Total de jugadores
- MMR promedio general
- Diferencia de MMR entre equipos
- Jugadores sin asignar (si los hay)

## 💾 Almacenamiento

Los datos se guardan automáticamente en el localStorage del navegador, por lo que:
- Los jugadores persisten entre sesiones
- No se pierden datos al cerrar el navegador
- Cada equipo se recalcula automáticamente al agregar nuevos jugadores

## 🎯 Ejemplo de Equipo Ideal

```
Equipo Perfecto:
- Pablo (Rol 1, MMR 5600) - Hard Carry
- Renato (Rol 2, MMR 4900) - Midlane  
- Augusto (Rol 3, MMR 5300) - Offlane
- Carlos (Rol 4, MMR 5500) - Soft Support
- Hernesto (Rol 5, MMR 5600) - Hard Support
```

## 🔧 Tecnologías

- HTML5
- CSS3 (con gradientes y efectos modernos)
- JavaScript (ES6+)
- localStorage para persistencia

## 📱 Responsive

La interfaz se adapta a diferentes tamaños de pantalla y funciona en dispositivos móviles.

---

¡Disfruta creando equipos balanceados para tus partidas de Dota 2! 🎮 