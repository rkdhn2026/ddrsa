/**
 * DDRSA skater registration backend (Google Apps Script web app).
 *
 * - doPost: the website registration form sends a registration here. It is saved
 *   as a new row in the "Registrations" sheet with Status = Pending and a Skater ID.
 * - doGet:  the Skaters page asks for the public list. Only rows where Status is
 *   "Approved" are returned. Always: id, name, discipline, group, club.
 *   The photo is returned for every approved skater who agreed to the public list (it is mandatory on the form).
 *   Instagram, Facebook and titles are returned ONLY when the row has
 *   "Show on public profile" = Yes (the parent or skater ticked the consent box).
 *   Date of birth, phone, email, parent details and the Aadhaar number are never sent out.
 *
 * To approve a skater: open the sheet and change Status from Pending to Approved
 * (check Discipline and Age group first, you can edit them).
 */

var SHEET_NAME = "Registrations";
var HEADERS = ["Skater ID", "Timestamp", "Status", "Name", "Discipline", "Age group", "Club",
               "Date of birth", "Gender", "Parent or guardian", "Mobile", "Email", "Skate type submitted",
               "Instagram", "Facebook", "Photo (Drive link)", "Titles and achievements",
               "Agreed to public list", "Show on public profile", "Aadhaar number"];
// Age is counted on 31 December of this year. Change it each season.
var COMPETITION_YEAR = 2026;
var PHOTO_FOLDER_NAME = "DDRSA skater photos";   // separate from anything else; created on first use
var MAX_PHOTO_BYTES = 1024 * 1024;
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

// Saves the (already shrunk) photo in the photo folder. Files stay private until the skater
// is approved AND the profile box was ticked; doGet then makes that one photo viewable.
function savePhoto_(skaterId, photo) {
  if (!photo || !photo.data || (photo.type !== "image/jpeg" && photo.type !== "image/png")) return "";
  var bytes = Utilities.base64Decode(photo.data);
  if (bytes.length > MAX_PHOTO_BYTES) return "";
  var folders = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
  var ext = photo.type === "image/png" ? ".png" : ".jpg";
  return folder.createFile(Utilities.newBlob(bytes, photo.type, skaterId + ext)).getUrl();
}

// Makes one approved skater's photo viewable by link and returns an image address for the website.
function publicPhoto_(driveUrl) {
  var m = /[-\w]{25,}/.exec(String(driveUrl || ""));
  if (!m) return "";
  try {
    var file = DriveApp.getFileById(m[0]);
    if (file.getSharingAccess() !== DriveApp.Access.ANYONE_WITH_LINK) {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    return "https://drive.google.com/thumbnail?id=" + m[0] + "&sz=w600";
  } catch (err) {
    return "";
  }
}

// Stable ID that never changes: DDRSA-0001, DDRSA-0002, ...
function nextId_() {
  var props = PropertiesService.getScriptProperties();
  var n = Number(props.getProperty("lastId") || 0) + 1;
  props.setProperty("lastId", String(n));
  return "DDRSA-" + ("0000" + n).slice(-4);
}

// Suggested age group from date of birth, age counted on 31 December of COMPETITION_YEAR.
// This is only a suggestion; whoever approves the row can change it.
function suggestGroup_(dob) {
  var d = new Date(dob + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  var ref = new Date(COMPETITION_YEAR, 11, 31);
  var age = ref.getFullYear() - d.getFullYear();
  if (ref.getMonth() < d.getMonth() || (ref.getMonth() === d.getMonth() && ref.getDate() < d.getDate())) age--;
  if (age < 6) return "toddlers";
  if (age < 10) return "cadet-6-8";
  if (age < 12) return "cadet-10-12";
  if (age < 15) return "sub-junior";
  if (age < 18) return "junior";
  return "senior";
}

// Public links must be web addresses. An Instagram handle like @name becomes a link.
function link_(value, site) {
  var s = String(value || "").trim();
  if (!s) return "";
  if (/^@?[A-Za-z0-9._]+$/.test(s) && site) return "https://" + site + "/" + s.replace(/^@/, "");
  return /^https:\/\/[^\s]+$/i.test(s) ? s : "";
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.website) return json_({ ok: true });            // honeypot: bots fill this in
    var name = clean_(data.name, 100), phone = clean_(data.phone, 20);
    var parent = clean_(data.parent, 100), aadhaar = String(data.aadhaar || "").replace(/\s/g, "");
    if (!name || !phone || !parent || !data.dob || !data.gender) return json_({ ok: false, error: "Required details are missing." });
    if (aadhaar && !/^\d{12}$/.test(aadhaar)) return json_({ ok: false, error: "Aadhaar number must be 12 digits." });
    var skate = clean_(data.skate, 20);
    var discipline = skate === "Inline" || skate === "Quad" ? skate : "";
    var skaterId = nextId_();
    var row = {
      "Skater ID": skaterId, "Timestamp": new Date(), "Status": "Pending", "Name": name,
      "Discipline": discipline, "Age group": suggestGroup_(clean_(data.dob, 10)), "Club": clean_(data.club, 100),
      "Date of birth": clean_(data.dob, 10), "Gender": clean_(data.gender, 10),
      "Parent or guardian": parent, "Mobile": phone, "Email": clean_(data.email, 100),
      "Skate type submitted": skate, "Instagram": clean_(data.instagram, 150), "Facebook": clean_(data.facebook, 200),
      "Photo (Drive link)": savePhoto_(skaterId, data.photoFile), "Titles and achievements": clean_(data.titles, 1000),
      "Agreed to public list": data.agreeList ? "Yes" : "No", "Show on public profile": data.agreeProfile ? "Yes" : "No",
      "Aadhaar number": aadhaar ? "'" + aadhaar : ""
    };
    getSheet_().appendRow(HEADERS.map(function (h) { return row[h]; }));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: "Could not save." });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.feed === "news") return news_();
  var rows = getSheet_().getDataRange().getValues();
  var head = rows.shift();
  var col = function (n) { return head.indexOf(n); };
  var skaters = [];
  rows.forEach(function (r) {
    if (String(r[col("Status")]).trim().toLowerCase() !== "approved") return;
    if (String(r[col("Agreed to public list")]).trim().toLowerCase() === "no") return;
    var disc = String(r[col("Discipline")]).trim().toLowerCase();
    var group = String(r[col("Age group")]).trim().toLowerCase();
    var s = {
      id: String(r[col("Skater ID")]).trim(),
      name: String(r[col("Name")]).trim(),
      discipline: disc === "inline" || disc === "quad" ? disc : "",
      group: GROUPS.indexOf(group) >= 0 ? group : "",
      club: String(r[col("Club")]).trim(),
      photo: publicPhoto_(r[col("Photo (Drive link)")])
    };
    if (String(r[col("Show on public profile")]).trim().toLowerCase() === "yes") {
      s.profile = {
        instagram: link_(r[col("Instagram")], "instagram.com"),
        facebook: link_(r[col("Facebook")], ""),
        titles: String(r[col("Titles and achievements")]).trim()
      };
    }
    skaters.push(s);
  });
  return json_({ ok: true, skaters: skaters });
}

// Latest posts from other skating sites, for the home page. Only title, link, date and a short excerpt.
var NEWS_SOURCES = [
  { site: "indiaskate.com", url: "https://indiaskate.com/feed/" },
  { site: "jharkhandskate.com", url: "https://jharkhandskate.com/feed/" }
];

function plain_(html, max) {
  var t = String(html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "'").replace(/&#8211;|&ndash;/g, "-").replace(/&hellip;|\[&#8230;\]|\[…\]/g, "")
    .replace(/&[#\w]+;/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? t.substring(0, max).replace(/\s+\S*$/, "") + "..." : t;
}

function news_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get("news");
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  var items = [];
  NEWS_SOURCES.forEach(function (src) {
    try {
      var res = UrlFetchApp.fetch(src.url, { muteHttpExceptions: true, followRedirects: true });
      if (res.getResponseCode() !== 200) return;
      var channel = XmlService.parse(res.getContentText()).getRootElement().getChild("channel");
      channel.getChildren("item").slice(0, 4).forEach(function (it) {
        var link = it.getChildText("link") || "";
        if (!/^https:\/\//i.test(link)) return;
        var d = new Date(it.getChildText("pubDate"));
        items.push({
          source: src.site, title: plain_(it.getChildText("title"), 140), link: link,
          date: isNaN(d.getTime()) ? "" : d.toISOString(), excerpt: plain_(it.getChildText("description"), 160)
        });
      });
    } catch (err) {}
  });
  var out = JSON.stringify({ ok: true, items: items });
  if (items.length) cache.put("news", out, 10800);   // keep for 3 hours
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
