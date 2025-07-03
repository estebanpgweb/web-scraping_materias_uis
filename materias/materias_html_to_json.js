const fs = require("fs");
const path = require("path");

// Función para extraer materias usando regex (sin dependencias externas)
function extraerMateriasDeHTML(htmlContent) {
  const materias = [];

  // Regex para encontrar las secciones de pestañas
  const tabRegex =
    /<div[^>]*id="(\d+)-tab"[^>]*class="[^"]*eael-tab-content-item[^"]*"[^>]*>(.*?)<\/div>/gs;

  let tabMatch;
  while ((tabMatch = tabRegex.exec(htmlContent)) !== null) {
    const nivel = parseInt(tabMatch[1]);
    const tabContent = tabMatch[2];

    // Regex para encontrar información de materias dentro de cada pestaña
    const materiaRegex =
      /<strong>Código:<\/strong>\s*(\w+)\s*<strong>\s*Créditos:<\/strong>\s*(\d+)\s*[-–]\s*([^<]+)/g;

    let materiaMatch;
    while ((materiaMatch = materiaRegex.exec(tabContent)) !== null) {
      const codigo = materiaMatch[1].trim();
      const creditos = parseInt(materiaMatch[2]);
      const nombre = materiaMatch[3].trim();

      // Limpiar el nombre de la materia
      const nombreLimpio = nombre
        .replace(/^\d+\s*[-–]\s*/, "")
        .replace(/^[-–]\s*/, "")
        .trim();

      // Solo agregar si no es código genérico o si es una electiva específica
      if (codigo !== "00000" || nombreLimpio.includes("Electiva")) {
        materias.push({
          codigo: codigo,
          nombre: nombreLimpio,
          creditos: creditos,
          requisitos: [],
          nivel: nivel,
        });
      }
    }
  }

  // Buscar electivas en la pestaña especial
  const electivasRegex =
    /<div[^>]*data-title-link="electivas-tab"[^>]*>(.*?)<\/div>/s;
  const electivasMatch = htmlContent.match(electivasRegex);

  if (electivasMatch) {
    const electivasContent = electivasMatch[1];
    const materiaRegex =
      /<strong>Código:<\/strong>\s*(\w+)<strong>\s*Créditos:<\/strong>\s*(\d+)\s*[-–]\s*([^<]+)/g;

    let materiaMatch;
    while ((materiaMatch = materiaRegex.exec(electivasContent)) !== null) {
      const codigo = materiaMatch[1].trim();
      const creditos = parseInt(materiaMatch[2]);
      const nombre = materiaMatch[3].trim();

      const nombreLimpio = nombre
        .replace(/^\d+\s*[-–]\s*/, "")
        .replace(/^[-–]\s*/, "")
        .trim();

      materias.push({
        codigo: codigo,
        nombre: nombreLimpio,
        creditos: creditos,
        requisitos: [],
        nivel: "electiva",
      });
    }
  }

  return materias;
}

// Función alternativa más robusta usando múltiples patrones
function extraerMateriasAlternativo(htmlContent) {
  const materias = [];

  // Remover etiquetas HTML y decodificar entidades
  const textoLimpio = htmlContent
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");

  // Buscar patrones de materias en el texto limpio
  const patronMateria =
    /Código:\s*(\w+)\s+Créditos:\s*(\d+)\s*[-–]\s*([^\r\n]+)/g;

  let match;
  let nivelActual = 1;

  // Detectar cambios de nivel basado en contexto
  const lineas = textoLimpio.split(/[\r\n]+/);

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();

    // Detectar si estamos en una nueva pestaña/nivel
    if (linea.includes("-tab")) {
      const nivelMatch = linea.match(/(\d+)-tab/);
      if (nivelMatch) {
        nivelActual = parseInt(nivelMatch[1]);
      }
    }

    // Buscar materias en la línea actual
    const materiaMatch = linea.match(patronMateria);
    if (materiaMatch) {
      for (let j = 0; j < materiaMatch.length; j++) {
        const match = patronMateria.exec(linea);
        if (match) {
          const codigo = match[1].trim();
          const creditos = parseInt(match[2]);
          const nombre = match[3]
            .trim()
            .replace(/^\d+\s*[-–]\s*/, "")
            .replace(/^[-–]\s*/, "")
            .trim();

          if (codigo !== "00000" || nombre.includes("Electiva")) {
            // Detectar si es electiva
            const nivel =
              linea.includes("electiva") ||
              nombre.toLowerCase().includes("electiva")
                ? "electiva"
                : nivelActual;

            materias.push({
              codigo: codigo,
              nombre: nombre,
              creditos: creditos,
              requisitos: [],
              nivel: nivel,
            });
          }
        }
      }
    }
  }

  return materias;
}

// Función principal mejorada
function convertirHtmlAJson(htmlContent, filename) {
  // Intentar ambos métodos
  let materias = extraerMateriasDeHTML(htmlContent);

  // Si el primer método no encuentra suficientes materias, usar el alternativo
  if (materias.length < 5) {
    console.log(`Usando método alternativo para ${filename}`);
    materias = extraerMateriasAlternativo(htmlContent);
  }

  // Remover duplicados basado en código
  const materiasUnicas = [];
  const codigosVistos = new Set();

  for (const materia of materias) {
    if (!codigosVistos.has(materia.codigo)) {
      codigosVistos.add(materia.codigo);
      materiasUnicas.push(materia);
    }
  }

  // Ordenar por nivel y luego por código
  materiasUnicas.sort((a, b) => {
    if (a.nivel === "electiva" && b.nivel !== "electiva") return 1;
    if (a.nivel !== "electiva" && b.nivel === "electiva") return -1;
    if (a.nivel === "electiva" && b.nivel === "electiva")
      return a.codigo.localeCompare(b.codigo);

    if (a.nivel !== b.nivel) return a.nivel - b.nivel;
    return a.codigo.localeCompare(b.codigo);
  });

  return {
    materias: materiasUnicas,
  };
}

// Función para procesar todos los archivos HTML en una carpeta
function procesarCarpetaHTML(rutaCarpeta, rutaSalida = "./json_output") {
  // Crear carpeta de salida si no existe
  if (!fs.existsSync(rutaSalida)) {
    fs.mkdirSync(rutaSalida, { recursive: true });
  }

  // Leer todos los archivos de la carpeta
  const archivos = fs.readdirSync(rutaCarpeta);
  const archivosHTML = archivos.filter((archivo) =>
    archivo.toLowerCase().endsWith(".html")
  );

  if (archivosHTML.length === 0) {
    console.log("No se encontraron archivos HTML en la carpeta especificada.");
    return;
  }

  console.log(`Procesando ${archivosHTML.length} archivos HTML...`);

  archivosHTML.forEach((archivo) => {
    try {
      const rutaCompleta = path.join(rutaCarpeta, archivo);
      const contenidoHTML = fs.readFileSync(rutaCompleta, "utf8");

      // Convertir HTML a JSON
      const jsonData = convertirHtmlAJson(contenidoHTML, archivo);

      // Generar nombre del archivo JSON
      const nombreSinExtension = path.parse(archivo).name;
      const nombreJSON = `${nombreSinExtension}.json`;
      const rutaJSON = path.join(rutaSalida, nombreJSON);

      // Guardar archivo JSON
      fs.writeFileSync(rutaJSON, JSON.stringify(jsonData, null, 2), "utf8");

      console.log(
        `✓ Convertido: ${archivo} → ${nombreJSON} (${jsonData.materias.length} materias)`
      );
    } catch (error) {
      console.error(`✗ Error procesando ${archivo}:`, error.message);
    }
  });

  console.log(
    `\nProceso completado. Archivos JSON guardados en: ${rutaSalida}`
  );
}

// Función para procesar un archivo individual
function procesarArchivoIndividual(rutaArchivo) {
  try {
    const contenidoHTML = fs.readFileSync(rutaArchivo, "utf8");
    const filename = path.basename(rutaArchivo);
    const jsonData = convertirHtmlAJson(contenidoHTML, filename);

    console.log("Resultado de la conversión:");
    console.log(JSON.stringify(jsonData, null, 2));

    // Guardar archivo JSON en la misma carpeta
    const rutaSinExtension = rutaArchivo.replace(/\.html$/i, "");
    const rutaJSON = `${rutaSinExtension}.json`;
    fs.writeFileSync(rutaJSON, JSON.stringify(jsonData, null, 2), "utf8");

    console.log(`\nArchivo JSON guardado: ${rutaJSON}`);

    return jsonData;
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
}

// Exportar las funciones
module.exports = {
  convertirHtmlAJson,
  procesarCarpetaHTML,
  procesarArchivoIndividual,
};

// Ejecución desde línea de comandos
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("=".repeat(60));
    console.log("  CONVERSOR HTML A JSON - MATERIAS UIS");
    console.log("=".repeat(60));
    console.log("\nUso:");
    console.log(
      "  node materias_html_to_json.js <ruta_carpeta_html> [ruta_salida_json]"
    );
    console.log("  node materias_html_to_json.js <archivo_html_individual>");
    console.log("\nEjemplos:");
    console.log("  node materias_html_to_json.js ./html_files");
    console.log("  node materias_html_to_json.js ./html_files ./json_output");
    console.log("  node materias_html_to_json.js ./mi_archivo.html");
    console.log(
      '\nSi no especificas carpeta de salida, se creará "./json_output"'
    );
    console.log("=".repeat(60));
  } else if (args.length === 1) {
    const ruta = args[0];

    try {
      const stats = fs.statSync(ruta);

      if (stats.isDirectory()) {
        procesarCarpetaHTML(ruta);
      } else if (stats.isFile() && ruta.toLowerCase().endsWith(".html")) {
        procesarArchivoIndividual(ruta);
      } else {
        console.error("❌ El archivo debe tener extensión .html");
      }
    } catch (error) {
      console.error(
        `❌ Error: No se pudo acceder a "${ruta}". Verifica que la ruta sea correcta.`
      );
    }
  } else {
    const rutaCarpeta = args[0];
    const rutaSalida = args[1];

    try {
      procesarCarpetaHTML(rutaCarpeta, rutaSalida);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}
