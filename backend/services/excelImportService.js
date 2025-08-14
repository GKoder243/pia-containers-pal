const xlsx = require('xlsx');

/**
 * Extrait les en-têtes (la première ligne) d'une feuille de calcul Excel.
 * @param {Buffer} fileBuffer - Le buffer du fichier Excel.
 * @returns {string[]} Un tableau contenant les noms des colonnes.
 */
const getExcelHeaders = (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  // 'header: 1' indique à la bibliothèque de traiter la première ligne comme un tableau de valeurs.
  const headers = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];
  return headers.filter(h => h); // Filtre pour retirer les en-têtes vides
};

/**
 * Traite les données d'un fichier Excel en utilisant un mapping fourni.
 * @param {Buffer} fileBuffer - Le buffer du fichier Excel.
 * @param {object} mapping - Un objet de correspondance, ex: { 'numeroConteneur': 'N° Container', 'nomNavire': 'Navire' }.
 * @returns {object[]} Un tableau d'objets structurés selon le mapping.
 */
const processExcelWithMapping = (fileBuffer, mapping) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  // Inverse le mapping pour faciliter la recherche
  const reverseMapping = Object.entries(mapping).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {});

  const processedData = data.map(row => {
    const newRow = {};
    for (const excelHeader in row) {
      if (reverseMapping[excelHeader]) {
        const appField = reverseMapping[excelHeader];
        newRow[appField] = row[excelHeader];
      }
    }
    return newRow;
  });

  return processedData;
};

module.exports = {
  getExcelHeaders,
  processExcelWithMapping,
};