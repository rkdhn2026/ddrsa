/**
 * DDRSA skater registration backend (Google Apps Script web app).
 *
 * - doPost: the website registration form sends a registration here. It is saved
 *   as a new row in the "Registrations" sheet with Status = Pending.
 * - doGet:  the Skaters page asks for the public list. Only rows where Status is
 *   "Approved" are returned, and only four fields: name, discipline, group, club.
 *   Date of birth, phone, email and parent details are never sent out.
 *
 * To approve a skater: open the sheet and change Status from Pending to Approved
 * (check Discipline and Age group first, you can edit them).
 */

var SHEET_NAME = "Registrations";
var HEADERS = ["Timestamp", "Status", "Name", "Discipline", "Age group", "Club",
               "Date of birth", "Gender", "Parent or guardian", "Mobile", "Email", "Skate type submitted"];
var GROUPS = ["toddlers", "cadet-6-8", "cadet-10-12", "sub-junior", "junior", "senior"];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Stops spreadsheet formulas typed into the form from running (e.g. =IMPORTXML(...)).
function clean_(value, max) {
  var s = String(value == null ? "" : value).trim().substring(0, max || 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// Suggested age group from date of birth, age counted on 1 January 2027.
// This is only a suggestion; whoever approves the row can change it.
function suggestGroup_(dob) {
  var d = new Date(dob + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  var ref = new Date(2027, 0, 1);
  var age = ref.getFullYear() - d.getFullYear();
  if (ref.getMonth() < d.getMonth() || (ref.getMonth() === d.getMonth() && ref.getDate() < d.getDate())) age--;
  if (age < 6) return "toddlers";
  if (age < 10) return "cadet-6-8";
  if (age < 12) return "cadet-10-12";
  if (age < 15) return "sub-junior";
  if (age < 18) return "junior";
  return "senior";
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.website) return json_({ ok: true });            // honeypot: bots fill this in
    var name = clean_(data.name, 100), phone = clean_(data.phone, 20);
    if (!name || !phone) return json_({ ok: false, error: "Name and mobile number are required." });
    var skate = clean_(data.skate, 20);
    var discipline = skate === "Inline" || skate === "Quad" ? skate : "";
    getSheet_().appendRow([
      new Date(), "Pending", name, discipline, suggestGroup_(clean_(data.dob, 10)), clean_(data.club, 100),
      clean_(data.dob, 10), clean_(data.gender, 10), clean_(data.parent, 100), phone, clean_(data.email, 100), skate
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: "Could not save." });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  var rows = getSheet_().getDataRange().getValues();
  var head = rows.shift();
  var col = function (n) { return head.indexOf(n); };
  var skaters = [];
  rows.forEach(function (r) {
    if (String(r[col("Status")]).trim().toLowerCase() !== "approved") return;
    var disc = String(r[col("Discipline")]).trim().toLowerCase();
    var group = String(r[col("Age group")]).trim().toLowerCase();
    skaters.push({
      name: String(r[col("Name")]).trim(),
      discipline: disc === "inline" || disc === "quad" ? disc : "",
      group: GROUPS.indexOf(group) >= 0 ? group : "",
      club: String(r[col("Club")]).trim()
    });
  });
  return json_({ ok: true, skaters: skaters });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
