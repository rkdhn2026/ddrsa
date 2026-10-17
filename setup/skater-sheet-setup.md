# Skaters list: Google Sheet setup

The registration form saves each registration into a Google Sheet. Every skater gets a permanent **Skater ID** (DDRSA-0001, DDRSA-0002, ...). The Skaters page shows only the rows you mark **Approved**, and only name, discipline, age group and club. Instagram, Facebook, photo and titles are kept in the sheet and are only made available for public profiles when the parent or skater ticked the "show on public profile" box. Date of birth, Aadhaar number, phone, email and parent details always stay private in the sheet.

Profile pages are not built yet. The data is simply collected in the right shape so they can be added later.

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
3. Click **Deploy**. Google asks you to authorise access to your spreadsheet and your Google Drive (Drive is used to save skater photos in a folder called "DDRSA skater photos", created automatically on the first photo): choose your account, then Advanced > Go to project (unsafe) > Allow. This is normal for your own script.
4. Copy the **Web app URL** (it starts with `https://script.google.com/macros/s/`).

## 4. Send us the URL
Send the Web app URL to us. We paste it into `site-config.js` on the website and the form and the Skaters list go live.

## Approving skaters
- New registrations appear in the "Registrations" tab with **Status = Pending**.
- Check the row (birth certificate, club verification). Check **Discipline** (Inline or Quad) and **Age group**, and fix them if needed.
- The age group is only a suggestion worked out from the age on 31 December of the competition year (set `COMPETITION_YEAR` at the top of the script, currently 2026). Valid values: `toddlers`, `cadet-6-8`, `cadet-10-12`, `sub-junior`, `junior`, `senior`.
- Change **Status** to `Approved`. The skater shows on the Skaters list on the next page load.
- Columns **Instagram**, **Facebook**, **Photo (Drive link)** and **Titles and achievements** are optional and only used when **Show on public profile** says Yes.
- The **Aadhaar number** column is private. Only share the sheet with people you trust, and never with "anyone with the link". The number is saved as text so Sheets does not change it.
- To remove someone from the public list, change Status back to anything else (for example `Hidden`).

## If you change the script later
Use **Deploy > Manage deployments > edit > New version** so the same URL keeps working.

## Photos
A skater can choose a photo on the form. The browser shrinks it and sends it with the form, and the script saves it in the Drive folder "DDRSA skater photos" (created on the first photo). Photos stay private. Only when you set a row to Approved and that skater's parent ticked the profile box does the public list make that one photo viewable by link. Delete a file from the folder to remove a photo.
