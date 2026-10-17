# Skaters list: Google Sheet setup

The registration form saves each registration into a Google Sheet. The Skaters page shows only the rows you mark **Approved**, and only four fields: name, discipline, age group and club. Date of birth, phone, email and parent details stay private in the sheet.

Do this once, signed in to the Google account that should own the data (for example the DDRSA Gmail).

## 1. Create the sheet
1. Go to https://sheets.google.com and create a new blank spreadsheet. Name it "DDRSA registrations".

## 2. Add the script
1. In the sheet, open **Extensions > Apps Script**.
2. Delete the sample code, then paste in everything from `Code.gs` (in this `setup` folder).
3. Click **Save**. Name the project "DDRSA registrations".

## 3. Deploy as a web app
1. Click **Deploy > New deployment**. Click the gear icon and choose **Web app**.
2. Description: "DDRSA registrations". **Execute as: Me**. **Who has access: Anyone**.
3. Click **Deploy**. Google asks you to authorise access to your spreadsheet: choose your account, then Advanced > Go to project (unsafe) > Allow. This is normal for your own script.
4. Copy the **Web app URL** (it starts with `https://script.google.com/macros/s/`).

## 4. Send us the URL
Send the Web app URL to us. We paste it into `site-config.js` on the website and the form and the Skaters list go live.

## Approving skaters
- New registrations appear in the "Registrations" tab with **Status = Pending**.
- Check the row (birth certificate, club verification). Check **Discipline** (Inline or Quad) and **Age group**, and fix them if needed.
- The age group is only a suggestion worked out from date of birth on 1 January 2027. Valid values: `toddlers`, `cadet-6-8`, `cadet-10-12`, `sub-junior`, `junior`, `senior`.
- Change **Status** to `Approved`. The skater shows on the Skaters list on the next page load.
- To remove someone from the public list, change Status back to anything else (for example `Hidden`).

## If you change the script later
Use **Deploy > Manage deployments > edit > New version** so the same URL keeps working.
