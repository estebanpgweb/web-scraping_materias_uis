# Convertidor CSV a JSON para MongoDB

Este script convierte archivos CSV de estudiantes al formato JSON requerido para MongoDB.

## Instalación

1. **Instalar Node.js** (si no lo tienes):

   - Descarga desde https://nodejs.org/

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

## Uso

### Convertir un archivo único

```bash
node converter_csv.js CONSULTA_SQL_IngBiomedica.csv
```

### Convertir un archivo único con nombre de salida específico

```bash
node converter_csv.js CONSULTA_SQL_IngBiomedica.csv estudiantes_mongo.json
```

### Convertir múltiples archivos de un directorio

```bash
node converter_csv.js --dir ./csv_files
```

### Convertir múltiples archivos con directorio de salida específico

```bash
node converter_csv.js --dir ./csv_files ./json_output
```

## Características del convertidor

### Transformaciones aplicadas:

- ✅ Genera ObjectIds simulados para MongoDB
- ✅ Combina nombres y apellidos en campos separados
- ✅ Hashea passwords usando bcrypt
- ✅ Asigna permisos estándar de estudiante
- ✅ Mapea códigos de programa a información detallada
- ✅ Establece fechas de creación y actualización
- ✅ Mantiene información adicional como teléfono, email personal, etc.

### Mapeo de campos:

- `primer_nombre + segundo_nombre` → `name`
- `primer_apellido + segundo_apellido` → `lastname`
- `email` → `username`
- `doc_ident_est` → `identification`
- `codigo_est` → `student_code` (campo adicional)
- `programa_academico` → `program.id`

## Ejemplo de uso programático

```javascript
const { csvToJson, processMultipleFiles } = require("./converter_csv");

// Convertir un archivo
const data = csvToJson("mi_archivo.csv", "salida.json");

// Procesar múltiples archivos
processMultipleFiles("./csv_files", "./json_output");
```

## Personalización

### Agregar más programas académicos:

Edita el objeto `programMap` en la función `transformToMongoFormat`:

```javascript
const programMap = {
  69: {
    id: 69,
    new_pensum: false,
    name: "INGENIERIA BIOMEDICA",
  },
  // Agregar más programas...
};
```

### Modificar permisos de estudiante:

Edita el array `studentPermissions` según tus necesidades.

### Cambiar lógica de password:

Modifica la generación del password en la función `transformToMongoFormat`.

## Estructura del JSON de salida

Cada registro se convierte a:

```json
{
  "name": "Nombre completo",
  "lastname": "Apellidos completos",
  "username": "email@correo.uis.edu.co",
  "identification": "documento_identidad",
  "kind": "STUDENT",
  "password": "password_hasheado",
  "verified": false,
  "permissions": ["array_de_permisos"],
  "program": {
    "id": 69,
    "new_pensum": false,
    "name": "NOMBRE_PROGRAMA"
  },
  "__v": 0
}
```

## Notas importantes

- Los passwords se hashean usando bcrypt con salt de 10 rounds
- Se genera un ObjectId simulado para cada registro
- Los campos vacíos se manejan con valores por defecto
- Se preserva información adicional que podría ser útil
- El script es reutilizable para múltiples archivos CSV con la misma estructura
