/**
 * Smart Social AI — Google Apps Script Multi-Tenant
 *
 * INSTRUCCIONES DE DEPLOY:
 * 1. Abrí https://script.google.com y creá un nuevo proyecto
 * 2. Pegá este código reemplazando el contenido
 * 3. Clic en "Implementar" → "Nueva implementación"
 * 4. Tipo: Aplicación web
 * 5. Ejecutar como: Tú (cuenta que tiene acceso a todos los Sheets de clientes)
 * 6. Quién tiene acceso: Cualquier usuario
 * 7. Copiá la URL de implementación → es tu nuevo APPS_SCRIPT_BASE en el dashboard
 */

var FALLBACK_SHEET_ID = '1uIt7zeqdU4QcnQC6Fzw0phPWaO1ppiWY68HVVmpUPDg';

function doGet(e) {
  var params   = e.parameter || {};
  var sheetId  = params.sheetId  || FALLBACK_SHEET_ID;
  var tabName  = params.sheet === 'nube' ? 'Nube' : 'Base';
  var callback = params.callback || '';

  try {
    var ss   = SpreadsheetApp.openById(sheetId);
    var tab  = ss.getSheetByName(tabName);

    if (!tab) {
      return jsonpResponse(callback, []);
    }

    var rows    = tab.getDataRange().getValues();
    var headers = rows[0];
    var data    = [];

    for (var i = 1; i < rows.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        var val = rows[i][j];
        if (val instanceof Date) {
          val = val.toISOString();
        }
        obj[headers[j]] = val;
      }
      data.push(obj);
    }

    return jsonpResponse(callback, data);

  } catch (err) {
    return jsonpResponse(callback, { error: err.message });
  }
}

function jsonpResponse(callback, data) {
  var json    = JSON.stringify(data);
  var content = callback ? callback + '(' + json + ')' : json;
  var mime    = callback
    ? ContentService.MimeType.JAVASCRIPT
    : ContentService.MimeType.JSON;

  return ContentService
    .createTextOutput(content)
    .setMimeType(mime);
}
