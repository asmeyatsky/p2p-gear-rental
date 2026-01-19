# Bulk Upload Guide - Step-by-Step Instructions

## Upload Your Entire Inventory in Minutes

This guide provides detailed instructions for uploading multiple equipment items using our CSV bulk upload feature.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Download the CSV Template](#step-1-download-the-csv-template)
3. [Step 2: Understand the CSV Fields](#step-2-understand-the-csv-fields)
4. [Step 3: Prepare Your Data](#step-3-prepare-your-data)
5. [Step 4: Upload Your CSV File](#step-4-upload-your-csv-file)
6. [Step 5: Review Upload Results](#step-5-review-upload-results)
7. [Troubleshooting Common Errors](#troubleshooting-common-errors)
8. [Best Practices](#best-practices)
9. [Example CSV Data](#example-csv-data)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] An active account on the platform
- [ ] Verified email address
- [ ] Logged into your account
- [ ] Your inventory data ready (titles, descriptions, prices, etc.)
- [ ] Image URLs for your equipment (hosted online)
- [ ] A spreadsheet application (Excel, Google Sheets, or similar)

---

## Step 1: Download the CSV Template

### Instructions:

1. **Navigate to Bulk Upload Page**
   - Log into your account
   - Go to: `https://[yourdomain]/add-gear/bulk`
   - Or click "Add Gear" → "Bulk Upload" from the navigation

2. **Download the Template**
   - Click the **"Download Template"** button
   - A file named `gear_template.csv` will download
   - Open this file in Excel, Google Sheets, or any spreadsheet application

3. **Verify the Template**
   - The template should contain a header row with all field names
   - Do NOT modify the header row names

---

## Step 2: Understand the CSV Fields

### Required Fields

These fields MUST be filled in for each item:

| Field | Description | Example |
|-------|-------------|---------|
| `title` | Equipment name (max 100 chars) | `Canon EOS R5 Mirrorless Camera` |
| `description` | Detailed description (max 2000 chars) | `Professional 45MP full-frame camera with 8K video...` |
| `dailyRate` | Price per day in dollars | `150` |
| `city` | City where equipment is located | `Los Angeles` |
| `state` | State abbreviation (2 letters) | `CA` |
| `category` | Equipment category (see list below) | `cameras` |

### Optional Fields

These fields enhance your listings but are not required:

| Field | Description | Example | Default |
|-------|-------------|---------|---------|
| `weeklyRate` | Price per week | `900` | None |
| `monthlyRate` | Price per month | `3000` | None |
| `zipCode` | ZIP code | `90210` | None |
| `brand` | Manufacturer name | `Canon` | None |
| `model` | Model number/name | `EOS R5` | None |
| `condition` | Item condition | `excellent` | None |
| `replacementValue` | Item value for insurance | `3899` | None |
| `insuranceRequired` | Require insurance? | `true` | `false` |
| `insuranceRate` | Insurance rate (decimal) | `0.10` | `0.10` (10%) |
| `securityDeposit` | Deposit amount | `500` | None |
| `isAvailable` | Available for rent? | `true` | `true` |
| `imageUrl` | Direct URL to image | `https://example.com/camera.jpg` | None |

### Valid Category Values

Use EXACTLY one of these values for the `category` field:

```
cameras
lenses
lighting
audio
support
drones
accessories
studio
```

### Valid Condition Values

Use EXACTLY one of these values for the `condition` field:

```
new
excellent
good
fair
```

---

## Step 3: Prepare Your Data

### 3.1 Open Your Spreadsheet

1. Open the downloaded `gear_template.csv` in Excel or Google Sheets
2. You will see the header row with all field names
3. Each row below the header represents ONE equipment item

### 3.2 Enter Your Data

**For each piece of equipment, fill in a new row:**

```
Row 1: Headers (do not modify)
Row 2: First equipment item
Row 3: Second equipment item
Row 4: Third equipment item
... and so on
```

### 3.3 Formatting Rules

**IMPORTANT - Follow these rules exactly:**

| Rule | Correct | Incorrect |
|------|---------|-----------|
| Numbers without currency symbols | `150` | `$150` |
| Numbers without commas | `3899` | `3,899` |
| Decimals with period | `0.10` | `0,10` |
| Boolean as lowercase text | `true` | `TRUE`, `Yes`, `1` |
| State as 2-letter abbreviation | `CA` | `California` |
| Category in lowercase | `cameras` | `Cameras`, `CAMERAS` |
| No quotes around text | `Canon EOS R5` | `"Canon EOS R5"` |

### 3.4 Image URLs

For images, you need direct URLs to your images hosted online:

**Valid Image URL Examples:**
```
https://yourdomain.com/images/camera1.jpg
https://cdn.yoursite.com/gear/lens-50mm.png
https://storage.googleapis.com/bucket/equipment/tripod.jpg
```

**Invalid Image URLs:**
```
/images/camera.jpg                    (relative path)
C:\Users\Photos\camera.jpg           (local file)
https://instagram.com/p/ABC123       (not direct image)
```

**Tip:** If you don't have image URLs yet, leave the `imageUrl` field empty. You can add images later by editing each listing.

### 3.5 Save as CSV

1. After entering all data, save the file
2. **File → Save As → CSV (Comma delimited)**
3. Name it something like `my_inventory.csv`
4. Confirm CSV format if prompted

---

## Step 4: Upload Your CSV File

### 4.1 Navigate to Upload Page

1. Go to: `https://[yourdomain]/add-gear/bulk`
2. Ensure you are logged in

### 4.2 Select Your File

1. Click **"Choose File"** or the file input area
2. Navigate to your saved CSV file
3. Select the file and click **"Open"**
4. The filename should appear next to the input

### 4.3 Start Upload

1. Click the **"Upload File"** button
2. Wait for the upload to process
3. **Do NOT close the browser or navigate away**
4. Processing time depends on the number of items:
   - 50 items: ~10 seconds
   - 200 items: ~30 seconds
   - 500 items: ~1 minute
   - 1000 items: ~2 minutes

---

## Step 5: Review Upload Results

### 5.1 Success Message

If all items uploaded successfully:

```
✅ Successfully uploaded X items!
```

You will be redirected to your dashboard after 2 seconds.

### 5.2 Partial Success (Some Errors)

If some items failed:

```
⚠️ Bulk upload completed with X successes and Y errors.
```

The page will display:
- **Successfully uploaded:** Number of items added
- **Failed to upload:** Number of items with errors
- **Error Details:** List of failed rows with specific error messages

### 5.3 Understanding Error Messages

| Error Message | Meaning | How to Fix |
|---------------|---------|------------|
| `title is required` | Missing title | Add a title for this item |
| `dailyRate must be a positive number` | Invalid price | Enter a number > 0 |
| `Invalid enum value` for category | Wrong category | Use valid category from list |
| `Invalid enum value` for condition | Wrong condition | Use: new, excellent, good, fair |
| `state must be 2 characters` | Invalid state | Use 2-letter abbreviation (CA, NY) |
| `description is too long` | Over 2000 characters | Shorten the description |

### 5.4 Fix and Re-upload Failed Items

1. Note the row numbers that failed
2. Open your CSV file
3. Fix the errors in those specific rows
4. Create a new CSV with ONLY the corrected rows
5. Upload the new CSV file

---

## Troubleshooting Common Errors

### Error: "No file uploaded"

**Cause:** File was not selected properly
**Solution:**
1. Click "Choose File" again
2. Select your CSV file
3. Verify filename appears before clicking Upload

### Error: "Error parsing CSV file"

**Cause:** File format is incorrect
**Solution:**
1. Ensure file is saved as CSV (not XLSX or XLS)
2. Check for special characters in your data
3. Remove any extra commas within fields
4. Re-save as CSV UTF-8 format

### Error: "Unauthorized"

**Cause:** Session expired or not logged in
**Solution:**
1. Log out completely
2. Log back in
3. Navigate to bulk upload page
4. Try upload again

### Error: All rows failing validation

**Cause:** Header row is modified or missing
**Solution:**
1. Download a fresh template
2. Copy your data into the new template
3. Ensure header row matches exactly

### Error: Numbers not being recognized

**Cause:** Numbers formatted as text or with symbols
**Solution:**
1. Remove all `$` signs from prices
2. Remove all commas from numbers
3. Ensure decimal points (not commas) for decimals
4. Format cells as "Number" in your spreadsheet

---

## Best Practices

### Data Preparation

1. **Start Small** - Test with 5-10 items first before uploading entire inventory
2. **Check Spelling** - Proofread titles and descriptions
3. **Consistent Naming** - Use consistent naming conventions
4. **Complete Data** - Fill in as many optional fields as possible
5. **Quality Descriptions** - Write detailed, helpful descriptions

### Image Preparation

1. **Host Images First** - Upload images to a hosting service before bulk upload
2. **Use Direct URLs** - Ensure URLs point directly to image files
3. **Consistent Sizes** - Use images of similar dimensions
4. **High Quality** - Use clear, well-lit photos

### Pricing Strategy

1. **Research Market** - Check competitor pricing
2. **Set Weekly Discounts** - Weekly rate should be less than 7x daily rate
3. **Monthly Savings** - Monthly rate should offer significant savings
4. **Deposit Appropriately** - Set deposits based on item value

### Organization

1. **Batch by Category** - Upload cameras first, then lenses, etc.
2. **Track Progress** - Keep a checklist of what's uploaded
3. **Regular Updates** - Update availability and pricing regularly

---

## Example CSV Data

### Sample CSV Content

```csv
title,description,dailyRate,weeklyRate,monthlyRate,city,state,zipCode,category,brand,model,condition,replacementValue,insuranceRequired,insuranceRate,securityDeposit,isAvailable,imageUrl
Canon EOS R5 Body,Professional 45MP full-frame mirrorless camera. Includes battery and charger. 8K video capable.,150,900,3000,Los Angeles,CA,90028,cameras,Canon,EOS R5,excellent,3899,true,0.10,500,true,https://example.com/images/eos-r5.jpg
Sony FX3 Cinema Camera,Full-frame cinema camera with S-Cinetone. Includes handle and XLR adapter. 4K 120fps.,200,1200,4000,Los Angeles,CA,90028,cameras,Sony,FX3,excellent,3899,true,0.10,500,true,https://example.com/images/fx3.jpg
Canon RF 24-70mm f/2.8L,Professional standard zoom lens. Sharp and fast autofocus. Weather sealed.,75,450,1500,Los Angeles,CA,90028,lenses,Canon,RF 24-70mm f/2.8L,excellent,2299,true,0.10,300,true,https://example.com/images/rf-24-70.jpg
Aputure 600d Pro,High-output LED light with Bowens mount. Includes controller and power cable.,85,500,1700,Los Angeles,CA,90028,lighting,Aputure,600d Pro,new,1290,false,0.10,200,true,https://example.com/images/aputure-600d.jpg
DJI Ronin RS3 Pro,Professional 3-axis gimbal. 4.5kg payload. Includes focus motor.,45,270,900,Los Angeles,CA,90028,support,DJI,RS3 Pro,excellent,799,false,0.10,150,true,https://example.com/images/ronin-rs3.jpg
```

### How This Looks in a Spreadsheet

| title | description | dailyRate | weeklyRate | city | state | category | brand | condition |
|-------|-------------|-----------|------------|------|-------|----------|-------|-----------|
| Canon EOS R5 Body | Professional 45MP... | 150 | 900 | Los Angeles | CA | cameras | Canon | excellent |
| Sony FX3 Cinema Camera | Full-frame cinema... | 200 | 1200 | Los Angeles | CA | cameras | Sony | excellent |
| Canon RF 24-70mm f/2.8L | Professional standard... | 75 | 450 | Los Angeles | CA | lenses | Canon | excellent |

---

## Quick Reference Card

### Upload URL
```
https://[yourdomain]/add-gear/bulk
```

### Required Fields
```
title, description, dailyRate, city, state, category
```

### Valid Categories
```
cameras, lenses, lighting, audio, support, drones, accessories, studio
```

### Valid Conditions
```
new, excellent, good, fair
```

### Boolean Values
```
true, false (lowercase)
```

### Number Format
```
No $ signs, no commas, use periods for decimals
Example: 1500.00 (not $1,500.00)
```

---

## Need Help?

- **Technical Issues:** Contact support@[yourdomain].com
- **Data Formatting:** Refer to this guide
- **Template Issues:** Download a fresh template
- **Account Issues:** Contact support

---

*Last Updated: January 2026*
