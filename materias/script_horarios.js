async function waitForElementNotBusy(selector) {
  return new Promise((resolve) => {
    const checkState = () => {
      const element = document.querySelector(selector);
      if (element && element.getAttribute("aria-busy") === "false") {
        resolve();
        return;
      }
      requestAnimationFrame(checkState);
    };
    checkState();
  });
}

async function procesarMateria(codigoMateria) {
  const inputCodigo = document.querySelector("#form\\:txtCodigoAsignatura");
  const btnConsulta = document.querySelector("#form\\:btnConsultaAsignatura");

  if (!inputCodigo || !btnConsulta) {
    console.error("No se encontraron los elementos de consulta");
    return null;
  }

  inputCodigo.value = codigoMateria;
  btnConsulta.click();

  await waitForElementNotBusy("#form");

  const tableDiv = document.querySelector("#form\\:dtlListadoProgramadas");
  if (!tableDiv) {
    console.error(`No se encontró información para el código ${codigoMateria}`);
    return null;
  }

  const rows = tableDiv.querySelectorAll("tbody tr");
  const materiaInfo = {
    codigo: codigoMateria,
    nombre: "",
    grupos: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const columns = row.querySelectorAll("td div");

    if (i === 0) {
      materiaInfo.nombre = columns[1]?.textContent.trim();
    }

    const grupoInfo = {
      grupo: columns[2]?.textContent.trim(),
      capacidad: parseInt(columns[3]?.textContent.trim(), 10),
      matriculados: parseInt(columns[4]?.textContent.trim(), 10),
      horario: [],
    };

    const button = row.querySelector(
      `#form\\:dtlListadoProgramadas\\:${i}\\:btnIrVer`
    );

    if (button) {
      button.click();
      await waitForElementNotBusy("#form");

      const modalTable = document.querySelector(
        "#formHorario\\:dtlListadoParciales_data"
      );

      if (modalTable) {
        const modalRows = modalTable.querySelectorAll("tr");
        modalRows.forEach((modalRow) => {
          const modalColumns = modalRow.querySelectorAll("td div");
          grupoInfo.horario.push({
            dia: modalColumns[0]?.textContent.trim(),
            hora: modalColumns[1]?.textContent.trim(),
            edificio: modalColumns[2]?.textContent.trim(),
            aula: modalColumns[3]?.textContent.trim(),
            profesor: modalColumns[4]?.textContent.trim(),
          });
        });
      }

      const closeButton = document.querySelector(".ui-dialog-titlebar-close");
      if (closeButton) {
        closeButton.click();
        await waitForElementNotBusy("#form");
      }
    }

    materiaInfo.grupos.push(grupoInfo);
  }

  return materiaInfo;
}

async function procesarListaCodigos(listaCodigos) {
  const resultado = [];

  for (const codigo of listaCodigos) {
    console.log(`Procesando código: ${codigo}`);
    const materiaInfo = await procesarMateria(codigo);
    if (materiaInfo) {
      resultado.push(materiaInfo);
      console.log(`Completado código: ${codigo}`);
    }
  }

  return resultado;
}

(async function () {
  const listaCodigos = [
    "20252",
    "20253",
    "20254",
    "20255",
    "21857",
    "21858",
    "21870",
    "22109",
    "22490",
    "22948",
    "22949",
    "22950",
    "22951",
    "22952",
    "22953",
    "22954",
    "22955",
    "22956",
    "22957",
    "22958",
    "22959",
    "22960",
    "22961",
    "22962",
    "22963",
    "22964",
    "22965",
    "22966",
    "22967",
    "22968",
    "22969",
    "22970",
    "22971",
    "22972",
    "22973",
    "22974",
    "22975",
    "22976",
    "22977",
    "22978",
    "22979",
    "23423",
    "23424",
    "23425",
    "23427",
    "24542",
    "24543",
    "24544",
    "24545",
    "24546",
    "24548",
    "24549",
    "24550",
    "24551",
    "24552",
    "24553",
    "24554",
    "24555",
    "24556",
    "24557",
    "24558",
    "24560",
    "24936",
    "24948",
    "27288",
    "27571",
    "27572",
    "27582",
    "27586",
    "27798",
    "28091",
    "28661",
    "28664",
    "28665",
    "29058",
    "29155",
    "29156",
    "ELECT001",
    "ELECT003",
    "ELECT008",
    "ELECT010",
    "ELECT012",
  ];

  try {
    const resultado = await procesarListaCodigos(listaCodigos);
    console.log(JSON.stringify(resultado, null, 2));

    // Opcional: Guardar en localStorage por si el navegador se cierra
    localStorage.setItem("resultadoMaterias", JSON.stringify(resultado));
    console.log("Datos guardados en localStorage");
  } catch (error) {
    console.error("Error durante el procesamiento:", error);

    // Intentar recuperar últimos datos guardados en caso de error
    const datosGuardados = localStorage.getItem("resultadoMaterias");
    if (datosGuardados) {
      console.log(
        "Datos previos recuperados de localStorage:",
        JSON.parse(datosGuardados)
      );
    }
  }
})();
