const fs = require('fs').promises;

async function obtenerHorariosUnicos(rutaMaterias, rutaHorarios) {
    try {
        // Leer los archivos JSON desde las rutas
        const [materiasData, horariosData] = await Promise.all([
            fs.readFile(rutaMaterias, 'utf-8'),
            fs.readFile(rutaHorarios, 'utf-8')
        ]);

        // Parsear los datos JSON
        const materiasJson = JSON.parse(materiasData);
        const horariosJson = JSON.parse(horariosData);

        // Extraer los datos
        const materiasCodigos = materiasJson.materias.map(materia => materia.codigo);
        const horariosCodigos = horariosJson.map(horario => horario.codigo);

        // Filtrar códigos que están en horarios pero no en materias
        const codigosUnicosEnHorarios = horariosCodigos.filter(codigo => !materiasCodigos.includes(codigo));

        // Imprimir los códigos únicos
        console.log("Códigos que están en contexto_libre pero no estan en materias.json", codigosUnicosEnHorarios);
    } catch (error) {
        console.error("Error al cargar los archivos JSON:", error);
    }
}

// Ejemplo de uso:
const rutaMaterias = "./materias.json"; // Ruta al archivo materias.json
const rutaHorarios = "./contexto_libre.json"; // Ruta al archivo contexto_libre.json
// Llamar a la función
obtenerHorariosUnicos(rutaMaterias, rutaHorarios);
